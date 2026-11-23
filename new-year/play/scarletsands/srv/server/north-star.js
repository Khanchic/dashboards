/**
 * Механика 'northstar' — The North Star Expedition, Scarlet Sands.
 * Формат модуля как у конкурсов Witching Hours (halloween-week\app\src\contests\*.js):
 *   create(params, rng, ctx) / view(state, finished, ctx) / move(state, input, ctx) / sortKey / finalize / summary.
 *
 * Два конкурса бренда:
 *   { mode: 'training' }   — страница 0 (18.12+), одна лёгкая находка на тренировочной карте, без приза, можно заново.
 *   { mode: 'expedition' } — вся экспедиция игрока: 6 находок (2/2/2 из пула 20), 4 лапки Saffron, оазис, Golden Compass.
 *
 * ctx (от общего слоя):
 *   seed — Discord ID игрока (одна и та же экспедиция при любом пересоздании, План Б). Нет — случайный.
 *   now  — время сервера.
 *   open — что открыто сейчас: schedule.openAt(sched, now). Нет — открыто всё (плейтест).
 *
 * Ход: { do: 'pin', target: 's1'..'s6' | 'oasis' | 'super' | 'c1'..'c4', cell: 'A1'..'L9' }   (training: target 't')
 *      { do: 'restart' } — только training, новая тренировочная карта.
 * Попытки: находка 3, оазис 3, кот 3 (горячо/тепло/холодно), Golden Compass 2 (только «мимо»).
 * После 3 промахов находка/оазис показываются без штампа (нужны для оазиса); кот и Golden Compass — не показываются.
 * Ответы (answers) клиенту не уходят: view отдаёт клетку только найденного или раскрытого.
 */
const E = require('../shared/expedition');
const L = require('./levels');

const TRIES = { s: E.RULES.triesTask, oasis: E.RULES.triesOasis, super: E.RULES.triesSuper, c: 3, t: 3 };
const SLOTS = ['s1', 's2', 's3', 's4', 's5', 's6'];
const CATS = ['c1', 'c2', 'c3', 'c4'];
const MIN_GAP_MS = 200;
/**
 * Секрет сервера: карта = генератор(соль + Discord ID). Discord ID публичный, код генератора лежит на странице концепта,
 * поэтому без соли чужие ответы можно посчитать. В проде NS_SEED_SALT — длинная случайная строка в env, не в репозитории.
 * Та же соль + тот же ID = та же экспедиция (План Б: пересоздание из seed).
 * Решение 12.11 (Александр: «секретка — это очень важно»): без NS_SEED_SALT модуль НЕ запускается. Стенд и тесты ставят
 * 'dev-only-salt' сами; на проде (NODE_ENV=production или Railway) dev-соль и соль короче 32 символов — ошибка при старте.
 * Сгенерировать: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const DEV_SALT = 'dev-only-salt';
const SALT = process.env.NS_SEED_SALT;
const IS_PROD = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);
if (!SALT) throw new Error('northstar: NS_SEED_SALT не задан — без секрета ответы считаются по публичному Discord ID');
if (IS_PROD && (SALT === DEV_SALT || SALT.length < 32)) throw new Error('northstar: на проде нужна своя NS_SEED_SALT, 32+ символов (не dev-соль)');
const triesFor = (k) => TRIES[k] ?? TRIES[k[0]];
const isSlot = (k) => /^s\d$/.test(k);
const ALL_OPEN = { training: true, chapter: 3, cats: 4, oasis: true, closed: false };

function seedOf(ctx, rng) {
  if (ctx && ctx.seed != null) return String(ctx.seed);
  return String(Math.floor((rng || Math.random)() * 1e15)).padStart(15, '0');
}

function create(params = {}, rng, ctx = {}) {
  const mode = params.mode === 'training' ? 'training' : 'expedition';
  const seed = seedOf(ctx, rng);
  const st = { mode, seed, round: 0, pins: {}, tries: {}, done: {}, revealed: {}, last: null, lastAt: 0, startedAt: ctx.now ?? Date.now() };
  build(st);
  return st;
}

/** (Пере)строить карту из seed. Ответы лежат только в состоянии на сервере. */
function build(st) {
  if (st.mode === 'training') {
    // тренировка не должна повторять загадку/ответ экспедиции этого игрока (плейтест AG 18.11: Practice = Find 1, D8):
    // перебираем варианты, пока текст и ответ не отличаются от всех находок его экспедиции (детерминированно по seed)
    const ex = E.buildExpedition(`${SALT}:${st.seed}`);
    const texts = new Set(ex.tasks.map((k) => k.text)), answers = new Set(Object.values(ex.answers));
    let x = null, t = null;
    for (let v = 0; v < 40; v++) {
      x = E.buildExpedition(`${SALT}:training:${st.seed}:${st.round}${v ? ':' + v : ''}`);
      t = x.tasks[0];
      if (!texts.has(t.text) && !answers.has(x.answers.s1)) break;
    }
    st.map = { landmarks: x.landmarks, answers: { t: x.answers.s1 }, task: { item: t.item, type: t.type, text: t.text, hint: t.hint } };
    st.keys = ['t'];
  } else {
    const x = E.buildExpedition(`${SALT}:${st.seed}`);
    st.map = x;
    st.keys = [...SLOTS, 'oasis', 'super', ...CATS];
  }
  for (const k of st.keys) { st.pins[k] = []; st.tries[k] = triesFor(k); }
  st.done = {}; st.revealed = {};
}

// ---------- прогресс ----------
const found = (st) => SLOTS.filter((k) => st.done[k]).length;
const paws = (st) => CATS.filter((k) => st.done[k]).length;
const known = (st, k) => Boolean(st.done[k] || st.revealed[k]);
function progress(st) {
  if (st.mode === 'training') return { training: Boolean(st.done.t) };
  const f = found(st), p = paws(st);
  return { stamps: f + p, found: f, paws: p, oasis: Boolean(st.done.oasis), golden: Boolean(st.done.super) };
}
const superUnlocked = (st) => E.RULES.superUnlocked({ found: found(st), paws: paws(st), oasis: Boolean(st.done.oasis) });
/** Golden Compass уже недостижим: какая-то находка раскрыта, кот упущен, оазис провален. */
const superLost = (st) => SLOTS.some((k) => st.revealed[k]) || CATS.some((k) => !st.done[k] && st.tries[k] === 0) || Boolean(st.revealed.oasis);

/** Почему цель закрыта (null — открыта). */
function lockOf(st, k, open) {
  if (open.closed) return { why: 'closed' };
  if (st.mode === 'training') return open.training ? null : { why: 'not_open' };
  if (isSlot(k)) { const ch = Math.ceil(+k[1] / 2); return open.chapter >= ch ? null : { why: 'not_open', chapter: ch }; }
  if (k[0] === 'c') return open.cats >= +k[1] ? null : { why: 'not_released', cat: +k[1] };
  if (k === 'oasis') {
    if (!open.oasis) return { why: 'not_open' };
    const pr = progress(st);
    if (pr.stamps < E.RULES.oasisMinStamps) return { why: 'need_stamps', need: E.RULES.oasisMinStamps - pr.stamps };
    if (!known(st, 's1') || !known(st, 's3')) return { why: 'need_finds', slots: ['s1', 's3'].filter((s) => !known(st, s)) };
    return null;
  }
  if (k === 'super') {
    if (superLost(st)) return { why: 'lost' };
    if (!superUnlocked(st)) { const pr = progress(st); return { why: 'need_all', found: pr.found, paws: pr.paws, oasis: pr.oasis }; }
    return null;
  }
  return { why: 'bad_target' };
}

// ---------- view ----------
function pinsOut(st, k) { return st.pins[k].map((p) => (k === 'super' ? { cell: p.cell, hit: p.hit } : { cell: p.cell, heat: p.heat })); }
function targetOut(st, k, open) {
  const lock = st.done[k] || st.revealed[k] ? null : lockOf(st, k, open);
  const o = { key: k, tries: st.tries[k], max: triesFor(k), pins: pinsOut(st, k), done: Boolean(st.done[k]), revealed: Boolean(st.revealed[k]), lock };
  if (st.done[k] || (st.revealed[k] && (isSlot(k) || k === 'oasis' || k === 't'))) o.cell = st.map.answers[k];
  return o;
}

function view(state, finished, ctx = {}) {
  const open = (ctx && ctx.open) || ALL_OPEN;
  const st = state;
  const base = { mode: st.mode, landmarks: st.map.landmarks, last: st.last, done: Boolean(finished) || isComplete(st) };
  if (st.mode === 'training') {
    const t = targetOut(st, 't', open);
    const visible = !t.lock;
    return { ...base, task: visible ? { ...st.map.task, hint: t.tries <= 1 && !t.done ? st.map.task.hint : null } : null, target: t, progress: progress(st) };
  }
  const tasks = st.map.tasks.map((x) => {
    const t = targetOut(st, x.slot, open);
    const visible = !(t.lock && t.lock.why === 'not_open');
    return { ...t, slot: x.slot, chapter: x.chapter, tier: x.tier,
      item: visible ? x.item : null, type: visible ? x.type : null, text: visible ? x.text : null,
      hint: visible && !t.done && !t.revealed && t.tries <= 1 ? x.hint : null };
  });
  const oasis = targetOut(st, 'oasis', open);
  const sup = targetOut(st, 'super', open);
  const cats = CATS.map((k) => targetOut(st, k, open));
  const pr = progress(st);
  return {
    ...base, tasks, cats,
    oasis: { ...oasis, text: open.oasis ? st.map.oasis.text : null, hint: !oasis.lock && !oasis.done && !oasis.revealed && oasis.tries <= 1 ? st.map.oasis.hint : null },
    super: { ...sup, text: sup.lock ? null : st.map.super.text },
    progress: pr, tiers: L.reached(pr), superUnlocked: superUnlocked(st), superLost: superLost(st),
  };
}

// ---------- move ----------
function isComplete(st) {
  if (st.mode === 'training') return false;  // тренировку можно начать заново до закрытия
  const resolved = (k) => st.done[k] || st.tries[k] === 0;
  const base = [...SLOTS, ...CATS, 'oasis'].every(resolved);
  return base && (resolved('super') || superLost(st) || !superUnlocked(st));
}

function result(st) {
  const pr = progress(st);
  if (st.mode === 'training') return { training: true, solved: pr.training };
  return { ...pr, finds: SLOTS.filter((k) => st.done[k]).map((k) => st.map.tasks[+k[1] - 1].key) };
}

function move(state, input, ctx = {}) {
  const st = state;
  const now = ctx.now ?? Date.now();
  const open = ctx.open || ALL_OPEN;
  if (open.closed) return { error: 'closed' };
  if (!input || typeof input !== 'object') return { error: 'bad_input' };
  if (now - st.lastAt < MIN_GAP_MS) return { error: 'too_fast' };

  if (input.do === 'restart') {
    if (st.mode !== 'training') return { error: 'bad_input' };
    st.round += 1; st.last = null; build(st); st.lastAt = now;
    return { state: st, done: false, result: null };
  }
  if (input.do !== 'pin') return { error: 'bad_input' };
  const k = input.target, cell = String(input.cell || '').toUpperCase();
  if (!st.keys.includes(k)) return { error: 'bad_target' };
  if (!/^[A-L][1-9]$/.test(cell) || !E.inGrid(...E.at(cell))) return { error: 'bad_cell' };
  if (st.done[k] || st.tries[k] <= 0) return { error: 'target_finished' };
  const lock = lockOf(st, k, open);
  if (lock) return { error: lock.why, lock };
  if (st.pins[k].some((p) => p.cell === cell)) return { error: 'same_cell' };

  const wasSuper = st.mode === 'expedition' && superUnlocked(st);
  const fb = E.feedback(cell, st.map.answers[k]);
  st.tries[k] -= 1; st.lastAt = now;
  const pin = { cell, at: now };
  if (k === 'super') pin.hit = fb.hit; else pin.heat = fb.heat;
  st.pins[k].push(pin);
  const last = { target: k, cell, hit: fb.hit };
  if (k !== 'super') last.heat = fb.heat;
  if (fb.hit) st.done[k] = true;
  else if (st.tries[k] === 0) {
    st.revealed[k] = true;
    if (isSlot(k) || k === 'oasis' || k === 't') last.revealed = st.map.answers[k];
  }
  // что открылось этим ходом — для сообщений бота
  const pr = progress(st);
  last.unlocked = [];
  if (st.mode === 'expedition' && !wasSuper && superUnlocked(st)) last.unlocked.push('super');
  st.last = last;

  const done = isComplete(st);
  return { state: st, done, result: done ? result(st) : null, progress: pr };
}

/** Мест нет (уровни + розыгрыш). Ключ нужен движку: все с хотя бы одним штампом равны, порядок по времени. */
function sortKey(r, ms) { return r && (r.stamps > 0 || r.solved) ? [0, ms] : null; }

/** Закрытие: засчитываем то, что собрано. */
function finalize(state) { return result(state); }

const summary = (r) => {
  if (!r) return '—';
  if (r.training) return r.solved ? 'practice ✓' : 'practice';
  return `${r.stamps} stamps (${r.found} finds, ${r.paws} paws)` + (r.oasis ? ' · oasis' : '') + (r.golden ? ' · Golden Compass' : '');
};

module.exports = { id: 'northstar', create, view, move, sortKey, finalize, summary, progress, isComplete, SLOTS, CATS };
