/**
 * Fire Seven · Crack the 777 Vault — один замок.
 * Тот же интерфейс, что у halloween-week/app/src/contests/codebreaker.js (create / view / move / feedback),
 * чтобы подключить в общий слой без переделок. Отличия от Codebreaker (решения 11.11):
 *  - подсказка поэлементная, как в Wordle: 2 = на месте, 1 = есть, но не здесь, 0 = нет в коде;
 *  - у каждого замка свои настройки (лестница сложности 11.11): символов на барабане, повторы в коде, попытки;
 *    в замке без повторов попытка с повтором отклоняется (UI повторы и не даёт);
 *  - дворецкий: когда осталось 3 попытки (на 8 попытках = после 5 промахов), один раз на замок, попытку не тратит, +2,
 *    открывает символ на позиции, которая ещё ни разу не была зелёной;
 *  - попытки кончились без успеха → замок заклинило насовсем.
 * Секрет живёт только на сервере; в браузер уходит view() — цвета, без секрета до конца замка.
 */
const SYMBOLS = ['seven', 'diamond', 'champagne', 'bell', 'gift', 'pocket-watch', 'star', 'snowflake'];
const LEN = 4;
const TRIES = 8;
const BUTLER_LEFT = 3; // дворецкий доступен, когда осталось столько попыток
const BUTLER_COST = 2;
const MIN_TRY_GAP_MS = 1000;

function create(params = {}, rng = Math.random) {
  const n = Math.min(SYMBOLS.length, Math.max(LEN, params.symbols || 6));
  const repeats = !!params.repeats;
  let secret;
  if (repeats) secret = Array.from({ length: LEN }, () => Math.floor(rng() * n));
  else {
    const pool = Array.from({ length: n }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    secret = pool.slice(0, LEN);
  }
  return { n, len: LEN, repeats, tries: params.tries || TRIES, secret, guesses: [], butler: null, lastAt: 0, status: 'open' };
}

/** Wordle-подсказка. Повторы в попытке считаются честно (жёлтых не больше, чем таких символов в коде). */
function feedback(guess, secret) {
  const r = new Array(secret.length).fill(0);
  const left = {};
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) r[i] = 2;
    else left[secret[i]] = (left[secret[i]] || 0) + 1;
  }
  for (let i = 0; i < secret.length; i++) {
    if (r[i] !== 2 && left[guess[i]] > 0) { r[i] = 1; left[guess[i]]--; }
  }
  return r;
}

const solvedBy = (fb) => fb.every((v) => v === 2);
const butlerAvailable = (s) => s.status === 'open' && !s.butler && s.tries - s.guesses.length <= BUTLER_LEFT && s.guesses.length < s.tries;
const lockScore = (s) => (s.status === 'open' ? null : s.guesses.length + (s.butler ? BUTLER_COST : 0));

function view(state) {
  const finished = state.status !== 'open';
  return {
    symbols: SYMBOLS.slice(0, state.n),
    len: state.len,
    repeats: !!state.repeats,
    tries: state.tries,
    guesses: state.guesses.map((g) => ({ guess: g.guess, fb: g.fb })),
    butler: state.butler, // { pos, sym } — открытый дворецким символ
    butlerAvailable: butlerAvailable(state),
    status: state.status, // open | solved | jammed
    score: lockScore(state),
    secret: finished ? state.secret : undefined,
  };
}

/**
 * input: { guess: [индексы символов] } или { butler: true }.
 * ctx: { now, rng }. Возвращает { state, done, result } или { error }.
 */
function move(state, input = {}, ctx = {}) {
  if (state.status !== 'open') return { error: 'finished' };
  const rng = ctx.rng || Math.random;

  if (input.butler) {
    if (!butlerAvailable(state)) return { error: 'butler_unavailable' };
    const green = new Set();
    state.guesses.forEach((g) => g.fb.forEach((v, i) => { if (v === 2) green.add(i); }));
    let free = [...Array(state.len).keys()].filter((i) => !green.has(i));
    if (!free.length) free = [...Array(state.len).keys()];
    const pos = free[Math.floor(rng() * free.length)];
    state.butler = { pos, sym: state.secret[pos] };
    return { state, done: false, result: null };
  }

  const guess = Array.isArray(input.guess) ? input.guess.map(Number) : null;
  if (!guess || guess.length !== state.len || guess.some((v) => !Number.isInteger(v) || v < 0 || v >= state.n)) return { error: 'bad_guess' };
  if (!state.repeats && new Set(guess).size !== guess.length) return { error: 'repeat_symbol' };
  const now = ctx.now ?? Date.now();
  if (now - (state.lastAt || 0) < MIN_TRY_GAP_MS) return { error: 'too_fast' };
  state.lastAt = now;

  const fb = feedback(guess, state.secret);
  state.guesses.push({ guess, fb, at: now });
  if (solvedBy(fb)) state.status = 'solved';
  else if (state.guesses.length >= state.tries) state.status = 'jammed';
  const done = state.status !== 'open';
  return {
    state,
    done,
    result: done ? { solved: state.status === 'solved', tries: state.guesses.length, butler: !!state.butler, score: lockScore(state), at: now } : null,
  };
}

const summary = (r) => (r.solved ? `${r.tries} tries${r.butler ? ' + butler' : ''}` : 'jammed');

module.exports = { id: 'vault-lock', SYMBOLS, LEN, TRIES, BUTLER_LEFT, BUTLER_COST, create, view, move, feedback, lockScore, butlerAvailable, summary };
