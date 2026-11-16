/**
 * Загадка Мага: под какой из n цветных шляп фишка.
 * Условия добавляются, пока не останется ровно одна позиция. Все условия верны для ответа.
 * Минимум подсказок: 3 шляпы → 2, 4–5 шляп → 3 (если набор условий позволяет; на деле 2–4).
 * Условия структурные ({ k, c }), текст собирает клиент (clueText) — сервер не зависит от языка.
 */
const COLORS = ['red', 'blue', 'gold', 'white', 'purple'];

// позиции считаются слева направо с точки зрения игрока
const TEST = {
  not:    (k) => (p) => p !== k,
  left:   (k) => (p) => k < p,             // шляпа цвета c где-то левее фишки
  right:  (k) => (p) => k > p,             // шляпа цвета c где-то правее фишки
  near:   (k) => (p) => Math.abs(k - p) === 1,
};
const EDGE = (n) => (p) => p === 0 || p === n - 1;
const MIDDLE = (n) => (p) => p > 0 && p < n - 1;

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Функция-проверка одного условия для раскладки colors (цвет по позиции). */
function predicate(clue, colors) {
  const n = colors.length;
  if (clue.k === 'edge') return EDGE(n);
  if (clue.k === 'middle') return MIDDLE(n);
  return TEST[clue.k](colors.indexOf(clue.c));
}

/** Все позиции, подходящие под все условия. */
function solve(colors, clues) {
  const out = [];
  for (let p = 0; p < colors.length; p++) if (clues.every((c) => predicate(c, colors)(p))) out.push(p);
  return out;
}

function make(n, rng) {
  if (n < 3 || n > COLORS.length) throw new Error('riddle: n must be 3..5');
  const colors = shuffle(COLORS, rng).slice(0, n);
  const answer = Math.floor(rng() * n);
  const minClues = Math.min(n - 1, 3);
  let cand = [...Array(n).keys()];
  const used = new Set();
  const clues = [];
  while (cand.length > 1) {
    let opts = [];
    colors.forEach((c, k) => {
      if (k !== answer) opts.push({ k: 'not', c, w: 1 });
      if (k < answer) opts.push({ k: 'left', c, w: 2 });
      if (k > answer) opts.push({ k: 'right', c, w: 2 });
      if (Math.abs(k - answer) === 1) opts.push({ k: 'near', c, w: 2 });
    });
    opts.push(EDGE(n)(answer) ? { k: 'edge', w: 1 } : { k: 'middle', w: 1 });
    opts = opts.filter((o) => {
      const key = o.k + ':' + (o.c || '');
      if (used.has(key)) return false;
      const f = predicate(o, colors);
      return cand.some((p) => !f(p)); // условие должно что-то отсекать
    });
    if (clues.length + 1 < minClues) {
      const soft = opts.filter((o) => cand.filter(predicate(o, colors)).length > 1);
      if (soft.length) opts = soft;
    }
    const total = opts.reduce((s, o) => s + o.w, 0);
    let x = rng() * total, pick = opts[0];
    for (const o of opts) { x -= o.w; if (x <= 0) { pick = o; break; } }
    used.add(pick.k + ':' + (pick.c || ''));
    const clue = pick.c ? { k: pick.k, c: pick.c } : { k: pick.k };
    clues.push(clue);
    cand = cand.filter(predicate(clue, colors));
  }
  return { colors, answer, clues };
}

module.exports = { COLORS, make, solve, predicate };
