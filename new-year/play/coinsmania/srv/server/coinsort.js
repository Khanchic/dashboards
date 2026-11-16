/**
 * Механика 'coinsort' — одна банка Merry Coinsmas: Coin Sort Piggy (CoinsMania).
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { jar: 'practice' | 'j1'..'j6' | 'golden' } — см. jars.js.
 *
 * Ходы:
 *   { do: 'pour', from, to } — пересыпать верхнюю серию одного цвета (сколько влезет). Сервер проверяет правила сам.
 *   { do: 'undo' }           — отменить последний ход (бесплатно, без лимита).
 *   { do: 'restart' }        — вернуть банку к началу (подсказки не возвращаются).
 *   { do: 'hint' }           — следующий верный ход (подсветка from → to). Если из текущей позиции решения нет —
 *                              сначала откатывает ходы до позиции, где оно есть (rewound = сколько ходов отменено).
 * Раздача у каждого своя (generate), решение не хранится — подсказку считает решатель от текущей позиции.
 * Скорость ничего не решает, мест нет.
 */
const C = require('../shared/coins');
const { jar: getJar, HINTS } = require('./jars');

const MAX_HISTORY = 3000;

function create(params, rng, ctx = {}) {
  const j = getJar(params && params.jar);
  if (!j) throw new Error('coinsort: bad jar ' + (params && params.jar));
  const g = C.generate(j, rng || Math.random);
  return {
    jar: j.id,
    cap: g.cap, colors: g.colors,
    start: C.clone(g.jars),
    jars: g.jars,
    hist: [],                 // [[from, to, n], ...] для undo
    hintsLeft: HINTS, hintsUsed: 0,
    pours: 0, undos: 0, restarts: 0,
    solverPours: g.solution,  // длина пути решателя от старта — только для лога fairplay, клиенту не уходит
    solved: false,
    lastAt: ctx.now ?? Date.now(),
  };
}

function view(state, finished) {
  const j = getJar(state.jar);
  return {
    jar: state.jar, title: j.title, size: j.size,
    practice: Boolean(j.practice), golden: Boolean(j.golden),
    cap: state.cap, colors: state.colors,
    jars: C.clone(state.jars),
    canUndo: state.hist.length > 0,
    stuck: !state.solved && !C.hasMoves(state.jars, state.cap),
    solved: state.solved,
    done: Boolean(finished) || state.solved,
    hintsLeft: state.hintsLeft,
    pours: state.pours,
  };
}

function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.solved) return { error: 'finished' };
  const what = input && input.do;
  let hint = null, rewound = 0;

  if (what === 'pour') {
    const f = input.from, t = input.to;
    const n = C.pour(state.jars, state.cap, f, t);
    if (!n) return { error: 'bad_pour' };
    state.hist.push([f, t, n]);
    if (state.hist.length > MAX_HISTORY) state.hist.shift();
    state.pours += 1;
  } else if (what === 'undo') {
    const last = state.hist.pop();
    if (!last) return { error: 'nothing_to_undo' };
    C.unpour(state.jars, last[0], last[1], last[2]);
    state.undos += 1;
  } else if (what === 'restart') {
    if (!state.hist.length) return { error: 'nothing_to_undo' };
    state.jars = C.clone(state.start);
    state.hist = [];
    state.restarts += 1;
  } else if (what === 'hint') {
    if (state.hintsLeft < 1) return { error: 'no_hints' };
    let s = C.solve(state.jars, state.cap, { limit: 40000 });
    while (!s.ok && state.hist.length) {
      const last = state.hist.pop();
      C.unpour(state.jars, last[0], last[1], last[2]);
      rewound += 1;
      s = C.solve(state.jars, state.cap, { limit: 40000 });
    }
    if (!s.ok) { // из стартовой позиции решение есть всегда (generate) — сюда попасть можно только при сбое решателя
      state.jars = C.clone(state.start); state.hist = [];
      s = C.solve(state.jars, state.cap, { limit: 200000 });
      if (!s.ok) return { error: 'no_hint' };
    }
    hint = { from: s.moves[0][0], to: s.moves[0][1] };
    state.hintsLeft -= 1; state.hintsUsed += 1;
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (C.isDone(state.jars, state.cap)) state.solved = true;
  const done = state.solved;
  const out = { state, done, result: done ? { jar: state.jar, solved: true, pours: state.pours, hints: state.hintsUsed } : null };
  if (hint) out.hint = { ...hint, rewound };
  return out;
}

/** Мест нет (приз = уровень по числу банок). Ключ нужен движку — все разобранные равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Время вышло, а банка не разобрана — монеты остаются в банке. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? `sorted · ${r.pours} pours` + (r.hints ? ` · ${r.hints} hint${r.hints > 1 ? 's' : ''}` : '') : 'mixed');

module.exports = { id: 'coinsort', create, view, move, sortKey, finalize, summary };
