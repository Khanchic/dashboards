/**
 * Механика 'camps' — карта 3 Christmas on Kilimanjaro (Jumanza): «Kilimanjaro Camps» (палатки у ёлок).
 * Контракт как у server/trail.js (формат конкурсов Witching Hours):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 *
 * params: { level } — уровень из levels.js ('t5' | 't6' | 'summit' | 'practice' …) или прямо уровень карты
 *         ('c1' | 'c2' | 'summit' | 'practice'); соответствие — CAMPS_OF ниже, можно переопределить params.camps.
 *         Название/пояс/подсказки берутся из levels.js, если такой уровень там есть.
 *
 * Поле: своё у каждого игрока — генератор по seed из rng движка, только доски с единственным решением.
 * Решение хранится в state и наружу (view) не уходит.
 *
 * Ходы:
 *   { do: 'set', s: [[cell, v], ...] } — пометки клеток: v = 0 пусто, 1 снег (✕), 2 палатка. Пачка целиком или никак.
 *   { do: 'reset' }                    — снять все пометки.
 *   { do: 'hint' }                     — лев: убирает одну неверную палатку (там ✕) или ставит одну верную (+ ✕ вокруг неё).
 * Решено, когда палатки игрока — корректное решение (любое, check() из shared/camps.js). Скорость не важна.
 */
const C = require('../shared/camps');
let getLevel = () => null;
try { getLevel = require('./levels').level; } catch { /* levels.js нет — работаем на своих уровнях */ }

const MAX_MARKS_PER_MOVE = 80;
/** Уровень ивента → уровень карты 3. */
const CAMPS_OF = { t5: 'c1', t6: 'c2', summit: 'summit', practice: 'practice', c1: 'c1', c2: 'c2' };
const OWN = {
  practice: { title: 'Practice camp', zone: 'Base camp', training: true },
  c1: { title: 'Alpine camp', zone: 'Alpine desert' },
  c2: { title: 'Glacier camp', zone: 'Glacier' },
  summit: { title: 'The summit', zone: 'Christmas tree on the peak', summit: true },
};

function create(params, rng, ctx = {}) {
  const levelId = params && params.level;
  const campsId = (params && params.camps) || CAMPS_OF[levelId];
  if (!campsId || !C.LEVELS[campsId]) throw new Error('camps: bad level ' + levelId);
  rng = rng || Math.random;
  const seed = Math.floor(rng() * 2 ** 32).toString(36) + '.' + Math.floor(rng() * 2 ** 32).toString(36);
  const g = C.generate(campsId, seed);
  const L = getLevel(levelId);
  return {
    level: levelId || campsId,
    camps: campsId,
    seed,
    puzzle: g.puzzle,
    solution: g.solution,
    marks: new Array(g.puzzle.N * g.puzzle.N).fill(0),
    sets: 0, resets: 0,
    hintsLeft: L && Number.isInteger(L.hints) ? L.hints : 3, hints: 0,
    solved: false,
    peek: null,
    lastAt: ctx.now ?? Date.now(),
  };
}

function view(state, finished) {
  const L = getLevel(state.level) || {};
  const own = OWN[state.camps] || {};
  const pz = state.puzzle;
  return {
    game: 'camps',
    level: state.level, camps: state.camps,
    title: L.title || own.title, zone: L.zone || own.zone,
    summit: Boolean(L.summit ?? own.summit), training: Boolean(L.training ?? own.training),
    N: pz.N, trees: pz.trees.slice(), blocked: pz.blocked.slice(), rows: pz.rows.slice(), cols: pz.cols.slice(),
    marks: state.marks.slice(),
    sets: state.sets,
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
  const pz = state.puzzle, NN = pz.N * pz.N;
  const fixed = new Set(pz.trees.concat(pz.blocked));

  if (what === 'set') {
    const s = input.s;
    if (!Array.isArray(s) || !s.length || s.length > MAX_MARKS_PER_MOVE) return { error: 'bad_marks' };
    const marks = state.marks.slice();
    for (const st of s) {
      if (!Array.isArray(st) || st.length !== 2) return { error: 'bad_marks' };
      const [i, v] = st;
      if (!Number.isInteger(i) || i < 0 || i >= NN || fixed.has(i)) return { error: 'bad_cell', marks: state.marks.slice() };
      if (v !== 0 && v !== 1 && v !== 2) return { error: 'bad_marks' };
      marks[i] = v;
    }
    state.marks = marks;
    state.sets += s.length;
  } else if (what === 'reset') {
    state.marks = new Array(NN).fill(0);
    state.resets += 1;
  } else if (what === 'hint') {
    if (state.hintsLeft < 1) return { error: 'no_hints' };
    const h = C.hint(pz, state.marks, state.solution);
    if (!h) return { error: 'no_path' };
    if (h.kind === 'wrong') state.marks[h.cell] = 1; // лев убирает неверную палатку: там снег
    else {
      state.marks[h.cell] = 2;
      for (const n of h.clear) state.marks[n] = 1;
    }
    state.peek = h;
    state.hintsLeft -= 1; state.hints += 1;
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (C.check(pz, C.tentsOf(state.marks)).ok) state.solved = true;
  const done = state.solved;
  return { state, done, result: done ? { level: state.level, game: 'camps', solved: true, sets: state.sets, hints: state.hints, resets: state.resets } : null };
}

/** Мест нет (приз = уровень по числу пройденного). Все прошедшие равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Ивент закрылся, а лагерь не собран — уровень остаётся непройденным. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? 'camp set up' + (r.hints ? ` · lion ${r.hints}` : '') : 'not set up');

module.exports = { id: 'camps', create, view, move, sortKey, finalize, summary, CAMPS_OF, MAX_MARKS_PER_MOVE };
