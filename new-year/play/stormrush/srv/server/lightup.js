/**
 * Механика 'lightup' — один дом (или ёлка) Light Up Christmas, Storm Rush.
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { level: 'training' | 'h1'..'h6' | 'tree' } — см. levels.js.
 *
 * Ходы:
 *   { do: 'turns', t: [i, i, ...] } — пачка нажатий (каждое = поворот плитки i на 90° по часовой). Клиент крутит
 *                                     у себя сразу и шлёт пачку раз в ~0,3 с; сервер сам считает ток.
 *   { do: 'golem' }                 — подсказка Golem: одна неправильная плитка встаёт как в решении и блокируется.
 *   { do: 'sparky' }                — подсказка Sparky: путь от батареи до одной тёмной лампочки (маски решения
 *                                     этих плиток приходят один раз, в ответе на этот ход).
 * Решение (sol/rot) никогда не уходит клиенту: view отдаёт только текущие маски. Скорость ничего не решает.
 */
const G = require('../shared/grid');
const { level: getLevel } = require('./levels');

const MAX_TURNS_PER_MOVE = 400;

function create(params, rng, ctx = {}) {
  const L = getLevel(params && params.level);
  if (!L) throw new Error('lightup: bad level ' + (params && params.level));
  const g = G.build(L, rng);
  return {
    level: L.id,
    R: g.R, C: g.C, src: g.src,
    cells: g.cells,
    golemLeft: L.golem, sparkyLeft: L.sparky,
    hints: { golem: 0, sparky: 0 },
    turns: 0,
    solved: false,
    peek: null,
    lastAt: ctx.now ?? Date.now(),
  };
}

function view(state, finished) {
  const L = getLevel(state.level);
  const masks = G.masksOf(state);
  const pw = G.power(state.cells, masks, state.src);
  let lit = 0, bulbs = 0;
  const tiles = state.cells.map((x, i) => {
    if (x.bulb) { bulbs++; if (pw.on[i]) lit++; }
    const t = { r: x.r, c: x.c, m: masks[i] };
    if (i === state.src) t.src = true;
    if (x.bulb) t.bulb = true;
    if (x.star) t.star = true;
    if (x.lock) t.lock = true;
    return t;
  });
  return {
    level: state.level, title: L.title, size: L.size, tree: Boolean(L.tree), training: Boolean(L.training),
    R: state.R, C: state.C, tiles,
    powered: Object.keys(pw.on).map(Number),
    lit, bulbs,
    solved: state.solved,
    done: Boolean(finished) || state.solved,
    golemLeft: state.golemLeft, sparkyLeft: state.sparkyLeft,
    turns: state.turns,
    peek: state.peek, // только в ответе на ход 'sparky'
  };
}

function pick(arr, rng) { return arr[Math.floor((rng || Math.random)() * arr.length)]; }

function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.solved) return { error: 'finished' };
  state.peek = null;
  const what = input && input.do;
  const n = state.cells.length;

  if (what === 'turns') {
    const t = input.t;
    if (!Array.isArray(t) || !t.length || t.length > MAX_TURNS_PER_MOVE) return { error: 'bad_turns' };
    for (const i of t) if (!Number.isInteger(i) || i < 0 || i >= n) return { error: 'bad_tile' };
    for (const i of t) { if (!state.cells[i].lock) { state.cells[i].rot += 1; state.turns += 1; } }
  } else if (what === 'golem') {
    if (state.golemLeft < 1) return { error: 'no_hints' };
    const wrong = [];
    state.cells.forEach((x, i) => { if (!x.lock && G.cur(x) !== x.sol) wrong.push(i); });
    if (!wrong.length) return { error: 'nothing_to_fix' };
    const i = pick(wrong, ctx.rng);
    const x = state.cells[i];
    x.rot += G.stepsToSol(x);
    x.lock = true;
    state.golemLeft -= 1; state.hints.golem += 1;
  } else if (what === 'sparky') {
    if (state.sparkyLeft < 1) return { error: 'no_hints' };
    const pw = G.power(state.cells, G.masksOf(state), state.src);
    let dark = [];
    state.cells.forEach((x, i) => { if (x.bulb && !pw.on[i]) dark.push(i); });
    if (!dark.length) state.cells.forEach((x, i) => { if (x.bulb) dark.push(i); });
    let i = pick(dark, ctx.rng);
    const cells = [];
    while (i !== -1) { cells.push(i); i = state.cells[i].par; }
    state.peek = { cells, masks: cells.map((j) => state.cells[j].sol) };
    state.sparkyLeft -= 1; state.hints.sparky += 1;
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (G.solved(state)) {
    state.solved = true;
    state.cells.forEach((x) => { x.lock = true; });
  }
  const done = state.solved;
  return { state, done, result: done ? { level: state.level, solved: true, turns: state.turns, hints: { ...state.hints } } : null };
}

/** Мест нет (приз = уровень по числу домов). Ключ нужен движку — все зажжённые равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Ивент закрылся, а дом не зажжён — он остаётся тёмным. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? `lit · ${r.turns} turns` + (r.hints.golem || r.hints.sparky ? ` · hints ${r.hints.golem}G/${r.hints.sparky}S` : '') : 'dark');

module.exports = { id: 'lightup', create, view, move, sortKey, finalize, summary, MAX_TURNS_PER_MOVE };
