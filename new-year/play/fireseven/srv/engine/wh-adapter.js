/**
 * Fire Seven · Crack the 777 Vault — модуль конкурса для приложения Witching Hours (halloween-week/app).
 *
 * Почему один конкурс, а не семь: в WH в каждый момент открыт ровно один contest (server.js отдаёт 409 на чужой id),
 * а у нас с 18:00 до 23:30 открыты все 7 замков. Поэтому весь сейф — ОДИН contest с окном 12:00–23:30 ET,
 * а замки и их расписание живут внутри state. Одна запись attempts на игрока (UNIQUE(brand, contest_id, discord_id))
 * как раз и есть его сейф. Регистрация: src/contests/index.js → MODULES.vault777 = require('<путь>/wh-adapter').
 *
 * Интерфейс как у codebreaker.js:
 *   create(params, rng, {now}) → state
 *   view(state, finished)      → то, что уходит в браузер (без секретов открытых замков)
 *   move(state, input, ctx)    → { state, done, result } | { error }
 *       input = { lock: 0..6, guess: [4 индекса] } | { lock: 0..6, butler: true }
 *   sortKey(result)            → [-замков, счёт, время последнего замка] (меньше — лучше) | null (ни одного замка)
 *   finalize(state)            → { result, ms } — в 23:30 при закрытии конкурса
 *   summary(result)            → строка для карточек и экспорта
 *
 * params: { opens: [ms × 7], close: ms } — абсолютные времена открытия замков и закрытия. В бою их даёт
 * vault-event.makeSchedule(); на тест-стенде с DEMO_START/DEMO_HOUR_MINUTES — пересчитать пропорционально окну
 * (см. scheduleFromWindow ниже). Без params берётся боевое расписание.
 */
const L = require('./vault-lock');
const E = require('./vault-event');

/** Расписание замков из окна конкурса WH (для сжатого времени): замок i — через i/11.5 окна, как 1 ч из 11.5 ч. */
function scheduleFromWindow(startMs, endMs) {
  const span = endMs - startMs;
  // вскрытие — через «полчаса» после закрытия в том же масштабе (бой: 23:30 → 00:00)
  return { opens: E.LOCKS.map((_, i) => Math.round(startMs + (span * i) / 11.5)), close: endMs, reveal: Math.round(endMs + (span * 0.5) / 11.5) };
}

function create(params = {}, rng = Math.random) {
  const sched = params.opens && params.close
    ? { opens: params.opens, close: params.close, reveal: params.reveal || params.close + 30 * 60000 }
    : E.makeSchedule();
  return {
    opens: sched.opens,
    close: sched.close,
    reveal: sched.reveal, // клиенту: когда показывать вскрытие (план Б может сдвинуть — тогда обновить state.reveal)
    locks: E.LOCKS.map((cfg) => L.create({ symbols: cfg.symbols, repeats: cfg.repeats, tries: cfg.tries }, rng)),
    lastAt: 0,
  };
}

const lockResult = (s) => (s.status === 'open' ? null : { solved: s.status === 'solved', tries: s.guesses.length, butler: !!s.butler, score: L.lockScore(s), at: s.guesses.length ? s.guesses[s.guesses.length - 1].at : null });

function summarize(state) {
  const results = state.locks.map(lockResult);
  return { ...E.playerSummary(results), locks: results };
}

function view(state, finished) {
  return {
    opens: state.opens,
    close: state.close,
    reveal: state.reveal,
    locks: state.locks.map((s, i) => ({ ...E.LOCKS[i], ...L.view(s) })), // секрет L.view отдаёт только у законченного замка
    total: summarize(state),
    finished: !!finished,
  };
}

function move(state, input = {}, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const i = Number(input.lock);
  if (!Number.isInteger(i) || i < 0 || i >= state.locks.length) return { error: 'bad_lock' };
  if (now < state.opens[i]) return { error: 'lock_not_open' };
  if (now >= state.close) return { error: 'closed' };
  // общий для всего сейфа предохранитель «не чаще раза в секунду» живёт в каждом замке (lastAt замка)
  const r = L.move(state.locks[i], input.butler ? { butler: true } : { guess: input.guess }, { now, rng: ctx.rng });
  if (r.error) return { error: r.error };
  const done = state.locks.every((s) => s.status !== 'open');
  return { state, done, result: done ? summarize(state) : null };
}

/** В 23:30: замок с попытками, но без решения, считается заклинившим (все его попытки + 2 за дворецкого). */
function finalize(state) {
  const locks = state.locks.map((s) => {
    if (s.status !== 'open') return lockResult(s);
    if (!s.guesses.length) return null; // замок не трогал — не считается
    s.status = 'jammed';
    return { solved: false, tries: s.guesses.length, butler: !!s.butler, score: s.tries + (s.butler ? L.BUTLER_COST : 0), at: null };
  });
  return { result: { ...E.playerSummary(locks), locks }, ms: 0 };
}

const sortKey = (result) => (result && result.cracked > 0 ? [-result.cracked, result.score, result.lastAt || 0] : null);
const summary = (r) => (r && r.cracked ? `${r.cracked}/7 locks · ${r.score} tries` : 'no locks');

module.exports = { id: 'vault777', create, view, move, finalize, sortKey, summary, scheduleFromWindow };
