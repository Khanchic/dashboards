/**
 * Механика 'trail' — одна тропа (или вершина) Christmas on Kilimanjaro, Jumanza.
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { level: 'practice' | 't1'..'t6' | 'summit' } — см. levels.js.
 *
 * Поле: случайный пазл своего уровня из server/pool.json (собран заранее, минимум ходов точный) + у каждой фигуры
 * случайный вид животного своей формы → у двух игроков даже одинаковый пазл выглядит по-разному.
 *
 * Ходы:
 *   { do: 'slides', s: [[i, to], ...] } — сдвиги фигур (i — номер фигуры, to — новая позиция по её оси). Клиент двигает
 *                                         у себя сразу, сервер проверяет каждый сдвиг (путь свободен) и сам решает «проехал».
 *   { do: 'reset' }                     — поле как в начале (сколько угодно раз).
 *   { do: 'hint' }                      — лев показывает один следующий ход кратчайшего решения от текущего положения.
 * Скорость и число ходов на приз не влияют: засчитывается любое решение.
 */
const J = require('../shared/jam');
const { level: getLevel } = require('./levels');

const MAX_SLIDES_PER_MOVE = 60;
const SAME_SHAPE = { h2: ['zebra', 'hippo', 'rhino'], h3: ['elephant', 'log'], v2: ['giraffe', 'flamingo'], v3: ['log'] };

let POOL = null;
function pool() {
  if (POOL) return POOL;
  try { POOL = require('./pool.json').levels || {}; } catch { POOL = {}; }
  return POOL;
}

function create(params, rng, ctx = {}) {
  const L = getLevel(params && params.level);
  if (!L) throw new Error('trail: bad level ' + (params && params.level));
  rng = rng || Math.random;
  const list = pool()[L.moves];
  const pz = list && list.length
    ? J.dec(list[Math.floor(rng() * list.length)])
    : J.generate({ moves: L.moves, pieces: L.pieces }, rng); // пула нет (разработка) — генерируем на месте
  const pieces = pz.pieces.map((p, i) => {
    if (i === 0) return { ...p, kind: 'car' };
    const kinds = SAME_SHAPE[p.o + p.len];
    return { ...p, kind: kinds[Math.floor(rng() * kinds.length)] };
  });
  return {
    level: L.id,
    pieces,
    start: pz.pos.slice(),
    pos: pz.pos.slice(),
    par: L.moves,
    slides: 0, resets: 0,
    hintsLeft: L.hints, hints: 0,
    solved: false,
    peek: null,
    lastAt: ctx.now ?? Date.now(),
  };
}

function view(state, finished) {
  const L = getLevel(state.level);
  return {
    level: state.level, title: L.title, zone: L.zone,
    summit: Boolean(L.summit), training: Boolean(L.training),
    W: J.W, exitRow: J.EXIT_ROW,
    pieces: state.pieces.map((p, i) => ({ o: p.o, len: p.len, fix: p.fix, kind: p.kind, pos: state.pos[i] })),
    par: state.par,
    slides: state.slides,
    hintsLeft: state.hintsLeft,
    solved: state.solved,
    done: Boolean(finished) || state.solved,
    peek: state.peek, // только в ответе на ход 'hint'
  };
}

function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.solved) return { error: 'finished' };
  state.peek = null;
  const what = input && input.do;

  if (what === 'slides') {
    const s = input.s;
    if (!Array.isArray(s) || !s.length || s.length > MAX_SLIDES_PER_MOVE) return { error: 'bad_slides' };
    // пачка применяется целиком или не применяется: сначала проверяем на копии
    const pos = state.pos.slice();
    for (const st of s) {
      if (!Array.isArray(st) || st.length !== 2) return { error: 'bad_slides' };
      const [i, to] = st;
      if (!J.canSlide(state.pieces, pos, i, to)) return { error: 'blocked', pos: state.pos.slice() };
      pos[i] = to;
      if (J.solved(pos)) break; // 4x4 выехал — дальше пачку не смотрим
    }
    state.pos = pos;
    state.slides += s.length;
  } else if (what === 'reset') {
    state.pos = state.start.slice();
    state.resets += 1;
  } else if (what === 'hint') {
    if (state.hintsLeft < 1) return { error: 'no_hints' };
    const path = J.solve(state.pieces, state.pos);
    if (!path || !path.length) return { error: 'no_path' };
    state.peek = { i: path[0].i, to: path[0].to, left: path.length };
    state.hintsLeft -= 1; state.hints += 1;
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (J.solved(state.pos)) state.solved = true;
  const done = state.solved;
  return { state, done, result: done ? { level: state.level, solved: true, slides: state.slides, par: state.par, hints: state.hints, resets: state.resets } : null };
}

/** Мест нет (приз = уровень по числу троп). Ключ нужен движку — все прошедшие равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Ивент закрылся, а тропа не пройдена — она остаётся закрытой. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? `cleared · ${r.slides} moves (best ${r.par})` + (r.hints ? ` · lion ${r.hints}` : '') : 'blocked');

module.exports = { id: 'trail', create, view, move, sortKey, finalize, summary, MAX_SLIDES_PER_MOVE };
