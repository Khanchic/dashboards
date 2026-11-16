// node engine/test.js — самопроверка движка Crack the 777 Vault
const assert = require('node:assert/strict');
const L = require('./vault-lock');
const E = require('./vault-event');

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

t('feedback: всё на месте / ничего / перестановка', () => {
  assert.deepEqual(L.feedback([0, 1, 2, 3], [0, 1, 2, 3]), [2, 2, 2, 2]);
  assert.deepEqual(L.feedback([4, 5, 6, 7], [0, 1, 2, 3]), [0, 0, 0, 0]);
  assert.deepEqual(L.feedback([3, 2, 1, 0], [0, 1, 2, 3]), [1, 1, 1, 1]);
  assert.deepEqual(L.feedback([0, 2, 5, 3], [0, 1, 2, 3]), [2, 1, 0, 2]);
});
t('feedback: повтор в попытке не даёт лишних жёлтых', () => {
  assert.deepEqual(L.feedback([1, 1, 1, 1], [0, 1, 2, 3]), [0, 2, 0, 0]);
  assert.deepEqual(L.feedback([2, 2, 0, 0], [0, 1, 2, 3]), [1, 0, 1, 0]);
});
t('create: 4 символа без повторов, в пределах n', () => {
  for (let k = 0; k < 500; k++) {
    const s = L.create({ symbols: 6 });
    assert.equal(new Set(s.secret).size, 4);
    assert.ok(s.secret.every((v) => v >= 0 && v < 6));
  }
  assert.equal(L.create({ symbols: 99 }).n, 8);
});
t('move: валидация и пауза 1 с', () => {
  const s = L.create({ symbols: 6 });
  assert.equal(L.move(s, { guess: [0, 1, 2] }, { now: 5000 }).error, 'bad_guess');
  assert.equal(L.move(s, { guess: [0, 1, 2, 6] }, { now: 5000 }).error, 'bad_guess');
  assert.equal(L.move(s, { guess: [0, 0, 1, 2] }, { now: 5000 }).error, 'repeat_symbol');
  assert.ok(!L.move(s, { guess: [0, 1, 2, 3] }, { now: 5000 }).error);
  assert.equal(L.move(s, { guess: [0, 1, 2, 4] }, { now: 5500 }).error, 'too_fast');
});
t('view: секрет скрыт, пока замок открыт', () => {
  const s = L.create({ symbols: 6 });
  assert.equal(L.view(s).secret, undefined);
  L.move(s, { guess: s.secret.slice() }, { now: 1e6 });
  assert.deepEqual(L.view(s).secret, s.secret);
});
t('решение с первой попытки: счёт 1', () => {
  const s = L.create({ symbols: 6 });
  const r = L.move(s, { guess: s.secret.slice() }, { now: 1e6 });
  assert.equal(r.done, true);
  assert.deepEqual({ solved: r.result.solved, tries: r.result.tries, score: r.result.score }, { solved: true, tries: 1, score: 1 });
});
const wrong = (s) => { const g = [...Array(s.n).keys()].filter((v) => !s.secret.includes(v)); return [g[0], g[1], s.secret[1], s.secret[0]]; };
t('дворецкий: когда осталось 3 попытки (на 8 попытках — после 5 промахов), раз на замок, не тратит попытку, +2', () => {
  const s = L.create({ symbols: 8 });
  let now = 1e6;
  for (let k = 0; k < 4; k++) L.move(s, { guess: wrong(s) }, { now: (now += 2000) });
  assert.equal(L.move(s, { butler: true }).error, 'butler_unavailable');
  L.move(s, { guess: wrong(s) }, { now: (now += 2000) });
  assert.equal(L.view(s).butlerAvailable, true);
  const r = L.move(s, { butler: true }, { rng: () => 0 });
  assert.ok(!r.error);
  assert.equal(s.guesses.length, 5);
  assert.equal(s.butler.sym, s.secret[s.butler.pos]);
  assert.equal(L.move(s, { butler: true }).error, 'butler_unavailable');
  const fin = L.move(s, { guess: s.secret.slice() }, { now: (now += 2000) });
  assert.equal(fin.result.tries, 6);
  assert.equal(fin.result.score, 8);
});
t('дворецкий открывает позицию, которая ещё не была зелёной', () => {
  const s = L.create({ symbols: 8 });
  const g = [s.secret[0], s.secret[1], s.secret[3], s.secret[2]]; // 0 и 1 зелёные
  let now = 1e6;
  for (let k = 0; k < 5; k++) L.move(s, { guess: g }, { now: (now += 2000) });
  L.move(s, { butler: true }, { rng: () => 0 });
  assert.ok([2, 3].includes(s.butler.pos));
});
t('замок с повторами: секрет может повторяться, попытка с повтором принимается', () => {
  let seen = false;
  for (let k = 0; k < 300; k++) { const s = L.create({ symbols: 6, repeats: true }); if (new Set(s.secret).size < 4) seen = true; }
  assert.ok(seen);
  const s = L.create({ symbols: 6, repeats: true, tries: 7 });
  assert.ok(!L.move(s, { guess: [0, 0, 1, 1] }, { now: 1e6 }).error);
  assert.equal(L.view(s).repeats, true);
});
t('дворецкий на замке с 5 попытками — после 2 промахов (осталось 3)', () => {
  const s = L.create({ symbols: 8, repeats: true, tries: 5 });
  const w = [0, 1, 2, 3].map(() => (s.secret.includes(7) ? 6 : 7));
  const miss = w.some((v, i) => v !== s.secret[i]) ? w : [5, 5, 5, 5];
  L.move(s, { guess: miss }, { now: 1e6 });
  assert.equal(L.view(s).butlerAvailable, false);
  L.move(s, { guess: miss }, { now: 1e6 + 2000 });
  assert.equal(L.view(s).butlerAvailable, true);
});
t('8 промахов → заклинило насовсем, счёт 8 (+2 с дворецким)', () => {
  const s = L.create({ symbols: 8 });
  let now = 1e6, r;
  for (let k = 0; k < 8; k++) r = L.move(s, { guess: wrong(s) }, { now: (now += 2000) });
  assert.equal(r.done, true);
  assert.equal(r.result.solved, false);
  assert.equal(r.result.score, 8);
  assert.equal(L.move(s, { guess: s.secret.slice() }, { now: now + 5000 }).error, 'finished');
});

t('расписание: 25.12 12:00…18:00 ET, взлом до 23:30, вскрытие 26.12 00:00 ET', () => {
  const S = E.makeSchedule();
  const at = (iso) => new Date(iso).getTime();
  assert.equal(E.lockPhase(S, 0, at('2026-12-25T11:59:59-05:00')), 'upcoming');
  assert.equal(E.lockPhase(S, 0, at('2026-12-25T12:00:00-05:00')), 'open');
  assert.equal(E.lockPhase(S, 6, at('2026-12-25T17:59:59-05:00')), 'upcoming');
  assert.equal(E.lockPhase(S, 6, at('2026-12-25T18:00:00-05:00')), 'open');
  assert.equal(E.lockPhase(S, 0, at('2026-12-25T23:29:59-05:00')), 'open');
  assert.equal(E.lockPhase(S, 0, at('2026-12-25T23:30:00-05:00')), 'closed');
  assert.equal(E.eventPhase(S, at('2026-12-25T23:45:00-05:00')), 'closed');
  assert.equal(E.eventPhase(S, at('2026-12-26T00:00:00-05:00')), 'opened');
  assert.equal(new Date(S.reveal).toISOString(), '2026-12-26T05:00:00.000Z'); // 07:00 Киева
});
t('репетиция: шаг 10 минут, вскрытие через 90', () => {
  const R = E.rehearsalSchedule('2026-12-18T12:00:00-05:00');
  assert.equal((R.opens[6] - R.opens[0]) / 60000, 60);
  assert.equal((R.reveal - R.opens[0]) / 60000, 90);
});
t('план Б: простой > 30 мин сдвигает закрытие и вскрытие, вскрытие не позже 01:00 ET 26.12', () => {
  const S = E.makeSchedule();
  assert.deepEqual(E.extendForOutage(S, 20), S);
  const X = E.extendForOutage(S, 45);
  assert.equal(new Date(X.reveal).toISOString(), '2026-12-26T05:45:00.000Z');
  assert.equal(new Date(X.close).toISOString(), '2026-12-26T05:15:00.000Z');
  const Y = E.extendForOutage(S, 180);
  assert.equal(new Date(Y.reveal).toISOString(), '2026-12-26T06:00:00.000Z');
  assert.equal(new Date(Y.close).toISOString(), '2026-12-26T05:30:00.000Z');
});
t('лестница: каждый следующий замок не легче предыдущего', () => {
  const hard = (l) => (l.repeats ? 1000 : 0) + (10 - l.tries) * 100 + l.symbols;
  for (let i = 1; i < E.LOCKS.length; i++) assert.ok(hard(E.LOCKS[i]) > hard(E.LOCKS[i - 1]), E.LOCKS[i].id);
  assert.equal(E.LOCKS[0].tries, 8); assert.equal(E.LOCKS[6].tries, 5);
});
t('офферы по числу замков', () => {
  assert.equal(E.offerFor(0), null);
  assert.equal(E.offerFor(2).price, 9.99);
  assert.equal(E.offerFor(3).price, 19.99);
  assert.equal(E.offerFor(7).name, 'Seven Sevens Case');
  assert.equal(E.offerFor(4).name, 'Velvet Combination');
  assert.equal(E.offerFor(1).hours, 48);
});
const res = (scores, lastAt = 100, jam = []) => scores.map((sc, i) => ({ solved: !jam.includes(i), tries: sc, butler: false, score: sc, at: i === 6 ? lastAt : i }));
t('топ-3: больше замков, меньше счёт, ничья — раньше последний замок, исключение по брендам', () => {
  const players = [
    { userId: 'a', results: res([3, 3, 3, 3, 3, 3, 3], 500) },  // 7 замков, 21
    { userId: 'b', results: res([3, 3, 3, 3, 3, 3, 3], 400) },  // 7, 21, раньше
    { userId: 'c', results: res([2, 2, 2, 2, 2, 2, 2], 900) },  // 7, 14
    { userId: 'd', results: res([1, 1, 1, 1, 1, 1, 5], 50, [6]) }, // 6 замков — ниже любого с 7
    { userId: 'e', results: res([4, 4, 4, 4, 4, 4, 4], 10) },  // 7, 28
  ];
  const top = E.rankTop(players);
  assert.deepEqual(top.map((x) => x.userId), ['c', 'b', 'a']);
  assert.deepEqual(top.map((x) => x.bonus.sc), [50, 30, 20]);
  assert.deepEqual(E.rankTop(players, new Set(['c'])).map((x) => x.userId), ['b', 'a', 'e']);
  // запасное правило: если открывших все 7 меньше трёх, место берёт открывший 6
  assert.deepEqual(E.rankTop(players.filter((p) => 'cd'.includes(p.userId))).map((x) => x.userId), ['c', 'd']);
  assert.equal(E.prizeFor('c', players[2].results, top).kind, 'top');
  const d = E.prizeFor('d', players[3].results, top);
  assert.equal(d.kind, 'rest'); assert.deepEqual(d.bonus, { fp: 5, gc: 100000, sc: 0 }); assert.equal(d.offer.price, 19.99);
  assert.equal(E.prizeFor('z', [null, null, null, null, null, null, null], top).kind, 'none');
});

const A = require('./wh-adapter');
t('адаптер WH: замки по расписанию, закрытие, итог и sortKey', () => {
  const S = E.makeSchedule();
  const st = A.create({ opens: S.opens, close: S.close });
  const at = (h, m = 0) => new Date(`2026-12-25T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`).getTime();
  assert.equal(A.move(st, { lock: 1, guess: [0, 1, 2, 3] }, { now: at(12, 30) }).error, 'lock_not_open');
  assert.equal(A.move(st, { lock: 9, guess: [0, 1, 2, 3] }, { now: at(12, 30) }).error, 'bad_lock');
  assert.ok(!A.move(st, { lock: 0, guess: st.locks[0].secret.slice() }, { now: at(12, 30) }).error);
  assert.equal(A.view(st).locks[0].status, 'solved');
  assert.equal(A.view(st).locks[1].secret, undefined);
  let now = at(19);
  for (let i = 1; i < 6; i++) A.move(st, { lock: i, guess: st.locks[i].secret.slice() }, { now: (now += 2000) });
  A.move(st, { lock: 6, guess: [0, 0, 0, 0].map((_, k) => (st.locks[6].secret[k] + 1) % 8) }, { now: (now += 2000) });
  assert.equal(A.move(st, { lock: 6, guess: [0, 1, 2, 3] }, { now: at(23, 30) }).error, 'closed');
  const f = A.finalize(st);
  assert.equal(f.result.cracked, 6);
  assert.equal(f.result.score, 6 + 5); // шесть замков с 1-й попытки + VII заклинил (5 попыток)
  assert.deepEqual(A.sortKey(f.result).slice(0, 2), [-6, 11]);
  assert.equal(A.sortKey({ cracked: 0 }), null);
  const D = A.scheduleFromWindow(0, 690 * 60000);
  assert.equal(D.opens[6], 360 * 60000);
});
t('адаптер WH: все 7 → done и результат сразу', () => {
  const st = A.create();
  let now = new Date('2026-12-25T20:00:00-05:00').getTime(), r;
  for (let i = 0; i < 7; i++) r = A.move(st, { lock: i, guess: st.locks[i].secret.slice() }, { now: (now += 2000) });
  assert.equal(r.done, true);
  assert.equal(r.result.cracked, 7);
  assert.equal(A.summary(r.result), '7/7 locks · 7 tries');
});

console.log(`\n${n} tests passed`);
