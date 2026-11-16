/**
 * Механика 'garland' — один ярус ёлки (или звезда ∞) Infinity Garland, NoLimitCoins.
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { level: 'practice' | 'g1'..'g6' | 'star' } — см. levels.js.
 *
 * Ходы:
 *   { do: 'links', t: [[a, b], ...] } — пачка переключений: связь соседних лампочек a–b есть → убрать, нет → провести
 *                                       (если у обеих меньше 2 связей; иначе пропускается). Клиент рисует сразу и шлёт
 *                                       пачку раз в ~0,3 с.
 *   { do: 'clear' }                   — стереть всё, кроме закреплённого подсказками.
 *   { do: 'coiny' }                   — подсказка: Coiny проводит гирлянду через одну лампочку, где у игрока не так,
 *                                       как в решении, и закрепляет эти 2 связи (мешающие связи соседей убирает).
 * Решение (sol) никогда не уходит клиенту. Засчитывается любая правильная петля. Скорость ничего не решает.
 */
const G = require('../shared/garland');
const { level: getLevel } = require('./levels');

const MAX_LINKS_PER_MOVE = 600;

function create(params, rng, ctx = {}) {
  const L = getLevel(params && params.level);
  if (!L) throw new Error('garland: bad level ' + (params && params.level));
  const g = G.build(L, rng);
  return {
    level: L.id, R: g.R, C: g.C, bulb: g.bulb, sol: g.sol,
    links: {}, locked: {},
    hintsLeft: L.hints, hints: 0, toggles: 0,
    solved: false, lastAt: ctx.now ?? Date.now(),
  };
}

function view(state, finished) {
  const L = getLevel(state.level);
  const c = G.check(state, state.links);
  return {
    level: state.level, title: L.title, size: L.size, star: Boolean(L.star), practice: Boolean(L.practice),
    R: state.R, C: state.C, bulb: state.bulb.join(''),
    links: Object.keys(state.links), locked: Object.keys(state.locked),
    onLoop: c.onLoop || 0, bulbs: state.bulb.reduce((a, b) => a + b, 0),
    solved: state.solved, done: Boolean(finished) || state.solved,
    hintsLeft: state.hintsLeft, toggles: state.toggles,
  };
}

function linksAt(state, x) {
  return Object.keys(state.links).filter((k) => { const [a, b] = G.unkey(k); return a === x || b === x; });
}

function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.solved) return { error: 'finished' };
  const what = input && input.do;
  const n = state.R * state.C;

  if (what === 'links') {
    const t = input.t;
    if (!Array.isArray(t) || !t.length || t.length > MAX_LINKS_PER_MOVE) return { error: 'bad_links' };
    for (const p of t) {
      if (!Array.isArray(p) || p.length !== 2) return { error: 'bad_link' };
      const [a, b] = p;
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= n || b >= n) return { error: 'bad_link' };
      if (!state.bulb[a] || !state.bulb[b] || !G.adjacent(state.C, a, b)) return { error: 'bad_link' };
    }
    const deg = G.degrees(n, state.links);
    for (const [a, b] of t) {
      const k = G.key(a, b);
      if (state.locked[k]) continue;
      if (state.links[k]) { delete state.links[k]; deg[a]--; deg[b]--; state.toggles++; }
      else if (deg[a] < 2 && deg[b] < 2) { state.links[k] = 1; deg[a]++; deg[b]++; state.toggles++; }
    }
  } else if (what === 'clear') {
    for (const k of Object.keys(state.links)) if (!state.locked[k]) delete state.links[k];
  } else if (what === 'coiny') {
    if (state.hintsLeft < 1) return { error: 'no_hints' };
    const solK = new Set(state.sol);
    const solAt = (x) => state.sol.filter((k) => { const [a, b] = G.unkey(k); return a === x || b === x; });
    const wrong = [];
    state.bulb.forEach((on, x) => {
      if (!on) return;
      const mine = linksAt(state, x).sort().join(), want = solAt(x).sort().join();
      if (mine !== want) wrong.push(x);
    });
    if (!wrong.length) return { error: 'nothing_to_fix' };
    const x = wrong[Math.floor((ctx.rng || Math.random)() * wrong.length)];
    for (const k of linksAt(state, x)) if (!solK.has(k)) delete state.links[k];
    for (const k of solAt(x)) {
      if (!state.links[k]) {
        for (const y of G.unkey(k)) {
          let mine = linksAt(state, y);
          while (mine.length >= 2) { // у соседа уже 2 связи: убрать ту, что не из решения (закреплённые — всегда из решения)
            const drop = mine.find((q) => !solK.has(q));
            if (!drop) break;
            delete state.links[drop];
            mine = linksAt(state, y);
          }
        }
        state.links[k] = 1;
      }
      state.locked[k] = 1;
    }
    state.hintsLeft -= 1; state.hints += 1;
  } else return { error: 'bad_input' };

  state.lastAt = now;
  if (G.check(state, state.links).solved) {
    state.solved = true;
    for (const k of Object.keys(state.links)) state.locked[k] = 1;
  }
  const done = state.solved;
  return { state, done, result: done ? { level: state.level, solved: true, toggles: state.toggles, hints: state.hints } : null };
}

/** Мест нет (приз = уровень по числу ярусов). Ключ нужен движку — все зажжённые равны, порядок по времени. */
function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

/** Ивент закрылся, а ярус не зажжён — он остаётся тёмным. */
function finalize() { return null; }

const summary = (r) => (r && r.solved ? `lit · ${r.toggles} moves` + (r.hints ? ` · ${r.hints} hints` : '') : 'dark');

module.exports = { id: 'garland', create, view, move, sortKey, finalize, summary, MAX_LINKS_PER_MOVE };
