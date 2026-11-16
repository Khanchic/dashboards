/**
 * Механика 'stripact' — один акт шоу Мага (Vegas Way NY 2026/27).
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 * params: { act: 1..6 } — раунды акта берутся из acts.js.
 *
 * Раунд: 'ready' → { do: 'start' } → 'show' → (карты: { do: 'ask' }) → 'pick' → { do: 'pick', slot } ×1–2 → следующий раунд.
 *  - shell  (напёрстки): клиент получает стартовую позицию фишки и перестановки только после start — они нужны для анимации.
 *            Выбирать можно, когда анимация по времени сервера почти закончилась (не раньше 80% длительности).
 *  - cards  (запомни расклад): расклад приходит после start и пропадает из view после ask; вопрос («где была звезда?»)
 *            приходит только после ask, не раньше чем через 90% времени показа.
 *  - riddle (загадка): цвета шляп и условия; ответ знает только сервер.
 * Очки: 3 с первой попытки, 1 со второй, 0 мимо. Скорость не считается (решение 11.11, правило аудита №10).
 */
const { act: getAct, POINTS_FIRST, POINTS_SECOND, TRIES } = require('./acts');
const riddle = require('./riddle');

const SYMBOLS = ['star', 'diamond', 'chip', 'triangle', 'hexagon', 'plus', 'bolt', 'square'];
const MIN_MOVE_GAP_MS = 250;   // защита от скриптов: человек не кликает чаще
const SHELL_LEAD_MS = 450;     // пауза клиента перед первой перестановкой
const SHELL_MIN_SHARE = 0.8;   // pick разрешён после 80% расчётной длительности анимации
const CARDS_MIN_SHARE = 0.9;   // ask разрешён после 90% времени показа

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const rint = (n, rng) => Math.floor(rng() * n);

function makeRound(cfg, rng) {
  if (cfg.type === 'shell') {
    const start = rint(cfg.n, rng);
    const swaps = [];
    let chip = start;
    for (let i = 0; i < cfg.swaps; i++) {
      const a = rint(cfg.n, rng), b = (a + 1 + rint(cfg.n - 1, rng)) % cfg.n;
      swaps.push([a, b]);
      if (chip === a) chip = b; else if (chip === b) chip = a;
    }
    return { ...cfg, start, swaps, answer: chip };
  }
  if (cfg.type === 'cards') {
    const layout = shuffle(SYMBOLS, rng).slice(0, cfg.n);
    return { ...cfg, layout, answer: rint(cfg.n, rng) };
  }
  if (cfg.type === 'riddle') {
    const r = riddle.make(cfg.n, rng);
    return { ...cfg, colors: r.colors, clues: r.clues, answer: r.answer };
  }
  throw new Error('stripact: unknown round type ' + cfg.type);
}

function create(params, rng, ctx = {}) {
  const a = getAct(params && params.act);
  if (!a) throw new Error('stripact: bad act ' + (params && params.act));
  return {
    act: a.act,
    rounds: a.rounds.map((cfg) => makeRound(cfg, rng)),
    cur: 0,
    phase: 'ready',
    tries: 0,
    misses: [],
    gains: [],
    points: 0,
    shownAt: null,
    lastAt: (ctx.now ?? Date.now()) - MIN_MOVE_GAP_MS,
    last: null,
  };
}

const shellMs = (r) => SHELL_LEAD_MS + r.swaps.length * (r.ms + 40);

/** Что видит клиент. Секреты (ответ, расклад после показа) не уходят. */
function trickView(r, phase, misses, finished) {
  const v = { type: r.type, n: r.n };
  if (r.type === 'shell') {
    v.start = r.start; // фишку показывают до тасовки — это часть фокуса
    if (phase !== 'ready' || finished) { v.swaps = r.swaps; v.ms = r.ms; v.durationMs = shellMs(r); }
  } else if (r.type === 'cards') {
    v.showMs = r.showMs;
    if (phase === 'show' || finished) v.layout = r.layout;
    if (phase === 'pick') {
      v.ask = r.layout[r.answer];
      v.revealed = misses.map((i) => ({ slot: i, symbol: r.layout[i] })); // промах переворачивает карту
    }
  } else if (r.type === 'riddle') {
    v.colors = r.colors;
    if (phase !== 'ready' || finished) v.clues = r.clues;
  }
  return v;
}

function view(state, finished) {
  const a = getAct(state.act);
  const done = finished || state.phase === 'done';
  const r = state.rounds[Math.min(state.cur, state.rounds.length - 1)];
  return {
    act: state.act,
    title: a.title,
    host: a.host,
    round: Math.min(state.cur, state.rounds.length - 1),
    of: state.rounds.length,
    phase: done ? 'done' : state.phase,
    tries: state.tries,
    triesLeft: TRIES - state.tries,
    misses: state.misses.slice(),
    gains: state.gains.slice(),
    points: state.points,
    trick: done ? null : trickView(r, state.phase, state.misses, false),
    last: state.last, // итог предыдущего раунда — для анимации ответа
  };
}

function endRound(state, gain, r) {
  state.last = {
    round: state.cur, type: r.type, gain, tries: state.tries, answer: r.answer, misses: state.misses.slice(),
    layout: r.type === 'cards' ? r.layout : undefined,
    colors: r.type === 'riddle' ? r.colors : undefined,
  };
  state.gains.push(gain);
  state.points += gain;
  state.cur += 1;
  state.tries = 0;
  state.misses = [];
  state.shownAt = null;
  state.phase = state.cur >= state.rounds.length ? 'done' : 'ready';
}

/** input: { do: 'start' } | { do: 'ask' } | { do: 'pick', slot } */
function move(state, input, ctx = {}) {
  const now = ctx.now ?? Date.now();
  if (state.phase === 'done') return { error: 'finished' };
  if (now - state.lastAt < MIN_MOVE_GAP_MS) return { error: 'too_fast' };
  const r = state.rounds[state.cur];
  const what = input && input.do;

  if (what === 'start') {
    if (state.phase !== 'ready') return { error: 'bad_phase' };
    state.phase = r.type === 'riddle' ? 'pick' : 'show';
    state.shownAt = now;
  } else if (what === 'ask') {
    if (r.type !== 'cards' || state.phase !== 'show') return { error: 'bad_phase' };
    if (now - state.shownAt < r.showMs * CARDS_MIN_SHARE) return { error: 'too_early' };
    state.phase = 'pick';
  } else if (what === 'pick') {
    if (state.phase === 'show' && r.type === 'shell') {
      if (now - state.shownAt < shellMs(r) * SHELL_MIN_SHARE) return { error: 'too_early' };
      state.phase = 'pick';
    }
    if (state.phase !== 'pick') return { error: 'bad_phase' };
    const slot = Number(input.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot >= r.n || state.misses.includes(slot)) return { error: 'bad_slot' };
    state.tries += 1;
    if (slot === r.answer) endRound(state, state.tries === 1 ? POINTS_FIRST : POINTS_SECOND, r);
    else {
      state.misses.push(slot);
      if (state.tries >= TRIES) endRound(state, 0, r);
    }
  } else return { error: 'bad_input' };

  state.lastAt = now;
  const done = state.phase === 'done';
  return { state, done, result: done ? { act: state.act, points: state.points, gains: state.gains.slice() } : null };
}

/** Vegas места не раздаёт (приз = уровень по сумме очков всех актов). Ключ нужен движку: больше очков — выше. */
function sortKey(result, ms) {
  return result.points > 0 ? [-result.points, ms] : null;
}

/** Акт брошен на середине и конкурс закрылся: засчитываются сыгранные раунды. */
function finalize(state, startedAt) {
  if (!state.gains.length) return null;
  return { result: { act: state.act, points: state.points, gains: state.gains.slice(), partial: true }, ms: state.lastAt - startedAt };
}

const summary = (r) => `${r.points} pts` + (r.partial ? ` (${r.gains.length}/3 rounds)` : '');

module.exports = { id: 'stripact', SYMBOLS, create, view, move, sortKey, finalize, summary, shellMs };
