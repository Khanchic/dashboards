/**
 * Механика Jumanza «3 карты до Килиманджаро» — роутер по уровню (levels.js → поле game):
 *   Карта 1 · 'trail'   — Safari Rush Hour (trail.js):          practice, t1, t2
 *   Карта 2 · 'bridges' — Safari Bridges / River crossing:       practice2, t3, t4
 *   Карта 3 · 'camps'   — Kilimanjaro Camps / Tents & Trees:     practice3, t5, t6, summit
 * Контракт тот же, что у trail.js (create / view / move / sortKey / finalize / summary), поэтому движок и dev-сервер
 * подключают его вместо trail.js без других правок. В state и view добавляется поле game — клиент по нему
 * выбирает экран (Trail / Bridges / CampsGame).
 */
const trail = require('./trail');
const bridges = require('./bridges');
const camps = require('./camps');
const { level: getLevel } = require('./levels');

const MODS = { trail, bridges, camps };
const gameOf = (levelId) => ((getLevel(levelId) || {}).game) || 'trail';
const modOf = (state) => MODS[(state && state.game) || 'trail'] || trail;

function create(params, rng, ctx = {}) {
  const L = getLevel(params && params.level);
  if (!L) throw new Error('route: bad level ' + (params && params.level));
  const game = gameOf(L.id);
  let state;
  if (game === 'bridges') {
    state = bridges.create({ level: L.id, kind: L.kind, title: L.title, zone: L.zone, hints: L.hints, training: Boolean(L.training), summit: Boolean(L.summit) }, rng, ctx);
  } else if (game === 'camps') {
    state = camps.create({ level: L.id, camps: L.kind }, rng, ctx);
  } else {
    state = trail.create({ level: L.id }, rng, ctx);
  }
  state.game = game;
  return state;
}

function view(state, finished) {
  const v = modOf(state).view(state, finished);
  v.game = state.game || 'trail';
  return v;
}

function move(state, input, ctx = {}) {
  const r = modOf(state).move(state, input, ctx);
  if (r && r.result) r.result.game = state.game || 'trail';
  return r;
}

/** Мест нет: все прошедшие равны, порядок по времени (как в trail.js). */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }
function finalize() { return null; }

function summary(r) {
  if (!r) return 'blocked';
  const m = MODS[r.game] || (r.kind ? bridges : trail);
  return m.summary(r);
}

module.exports = { id: 'trail', create, view, move, sortKey, finalize, summary, gameOf, MAX_SLIDES_PER_MOVE: trail.MAX_SLIDES_PER_MOVE };
