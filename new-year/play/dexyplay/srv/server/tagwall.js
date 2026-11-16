/**
 * Механика 'tagwall' — одна стена Dexy's Holiday Stream: Tag the City (DexyPlay).
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { wall: 'practice' | 'w1'..'w6' | 'mural' } — см. walls.js.
 *
 * Ходы:
 *   { do: 'cells', c: [[i, v], ...] } — пачка изменений клеток (v: 0 пусто, 1 закрашено, 2 «✕»). Клиент рисует у себя
 *                                       сразу и шлёт пачку раз в ~0,3 с; сервер сам проверяет решение.
 *   { do: 'hint' }                    — подсказка чата: одна неверная строка встаёт как в решении и блокируется.
 *   { do: 'clear' }                   — стереть всё, кроме подсказанных строк.
 * Картинка (решение) и её название никогда не уходят клиенту до того, как стена загорится. Засчитывается любая
 * сетка, совпадающая с цифрами (в пуле у всех картинок одно решение). Скорость ничего не решает.
 */
const P = require('../shared/picross');
const { wall: getWall, POOLS, HINTS } = require('./walls');

const MAX_CELLS_PER_MOVE = 400;

function create(params, rng, ctx = {}) {
  const w = getWall(params && params.wall);
  if (!w) throw new Error('tagwall: bad wall ' + (params && params.wall));
  const r = rng || Math.random;
  const pool = POOLS[w.pool];
  const pic = pool[Math.floor(r() * pool.length)];
  const flip = r() < 0.5;
  const rows = flip ? P.mirror(pic.rows) : pic.rows.slice();
  const cl = P.cluesOf(rows);
  return {
    wall: w.id,
    name: pic.name,
    flip,
    rows,                       // секрет: решение
    W: cl.W, H: cl.H,
    clues: { rows: cl.rows, cols: cl.cols },
    grid: new Array(cl.W * cl.H).fill(0),
    lockedRows: [],
    hintsLeft: HINTS, hintsUsed: 0,
    paints: 0, moves: 0,
    solved: false,
    lastAt: ctx.now ?? Date.now(),
  };
}

const cl = (state) => ({ W: state.W, H: state.H, rows: state.clues.rows, cols: state.clues.cols });

function view(state, finished) {
  const w = getWall(state.wall);
  const st = P.lineStatus(state.grid, cl(state));
  const v = {
    wall: state.wall, title: w.title, size: w.size, neon: w.neon,
    practice: Boolean(w.practice), mural: Boolean(w.mural),
    W: state.W, H: state.H,
    clues: state.clues,
    grid: state.grid.slice(),
    lockedRows: state.lockedRows.slice(),
    rowsOk: st.rows, colsOk: st.cols,
    solved: state.solved,
    done: Boolean(finished) || state.solved,
    hintsLeft: state.hintsLeft,
    paints: state.paints,
  };
  if (state.solved) v.name = state.name; // что было нарисовано — сюрприз до конца
  return v;
}

function pick(arr, rng) { return arr[Math.floor((rng || Math.random)() * arr.length)]; }
const solRow = (state, y) => state.rows[y].split('').map((c) => (c === '#' ? 1 : 0));

function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.solved) return { error: 'finished' };
  const what = input && input.do;
  const n = state.W * state.H;
  const locked = (i) => state.lockedRows.includes(Math.floor(i / state.W));

  if (what === 'cells') {
    const c = input.c;
    if (!Array.isArray(c) || !c.length || c.length > MAX_CELLS_PER_MOVE) return { error: 'bad_cells' };
    for (const e of c) {
      if (!Array.isArray(e) || !Number.isInteger(e[0]) || e[0] < 0 || e[0] >= n || ![0, 1, 2].includes(e[1])) return { error: 'bad_cell' };
    }
    for (const [i, v] of c) {
      if (locked(i) || state.grid[i] === v) continue;
      state.grid[i] = v; state.paints += 1;
    }
    state.moves = (state.moves || 0) + 1; // число пачек — для лога подозрительных решений (server/fairplay.js)
  } else if (what === 'hint') {
    if (state.hintsLeft < 1) return { error: 'no_hints' };
    const wrong = [];
    for (let y = 0; y < state.H; y++) {
      if (state.lockedRows.includes(y)) continue;
      const have = state.grid.slice(y * state.W, (y + 1) * state.W).map((v) => (v === 1 ? 1 : 0));
      if (!P.same(have, solRow(state, y))) wrong.push(y);
    }
    if (!wrong.length) return { error: 'nothing_to_fix' };
    const y = pick(wrong, ctx.rng);
    solRow(state, y).forEach((v, x) => { state.grid[y * state.W + x] = v ? 1 : 2; });
    state.lockedRows.push(y);
    state.hintsLeft -= 1; state.hintsUsed += 1;
  } else if (what === 'clear') {
    state.grid = state.grid.map((v, i) => (locked(i) ? v : 0));
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (P.check(state.grid, cl(state))) {
    state.solved = true;
    state.grid = state.grid.map((v) => (v === 1 ? 1 : 0));
  }
  const done = state.solved;
  return { state, done, result: done ? { wall: state.wall, solved: true, name: state.name, paints: state.paints, hints: state.hintsUsed } : null };
}

/** Мест нет (приз = уровень по числу стен). Ключ нужен движку — все расписанные равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Эфир закончился, а стена не дорисована — она остаётся серой. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? `tagged · ${r.name}` + (r.hints ? ` · ${r.hints} hint${r.hints > 1 ? 's' : ''}` : '') : 'grey');

module.exports = { id: 'tagwall', create, view, move, sortKey, finalize, summary, MAX_CELLS_PER_MOVE };
