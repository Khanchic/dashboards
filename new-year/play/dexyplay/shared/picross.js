/**
 * Picross (японский кроссворд) — общий код сервера и клиента (UMD: require() или window.Picross).
 * Картинка — массив строк, '#' закрашено, '.' пусто. Сетка игрока — массив W*H: 0 пусто, 1 закрашено, 2 «✕» (пометка «пусто»).
 * Засчитывается ЛЮБАЯ сетка, у которой строки и столбцы совпадают с цифрами (не обязательно «как в картинке»).
 * lineSolve — решатель «по строкам» (как решает человек, без угадывания): нужен, чтобы каждая картинка в пуле
 * решалась логикой и имела одно решение.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Picross = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Длины групп закрашенных подряд. Пустая строка → []. 2 («✕») считается пустой. */
  function runs(line) {
    var out = [], n = 0;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === 1) n++;
      else if (n) { out.push(n); n = 0; }
    }
    if (n) out.push(n);
    return out;
  }
  function same(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  /** ['.#.', ...] → { W, H, cells: [0/1] } */
  function parse(rows) {
    var H = rows.length, W = rows[0].length, cells = [];
    for (var y = 0; y < H; y++) {
      if (rows[y].length !== W) throw new Error('picross: row ' + y + ' has length ' + rows[y].length + ', expected ' + W);
      for (var x = 0; x < W; x++) cells.push(rows[y][x] === '#' ? 1 : 0);
    }
    return { W: W, H: H, cells: cells };
  }
  function mirror(rows) { return rows.map(function (r) { return r.split('').reverse().join(''); }); }

  function rowOf(grid, W, y) { return grid.slice(y * W, (y + 1) * W); }
  function colOf(grid, W, H, x) { var c = []; for (var y = 0; y < H; y++) c.push(grid[y * W + x]); return c; }

  /** Цифры по краям: { W, H, rows: [[..]], cols: [[..]] } */
  function cluesOf(rows) {
    var p = parse(rows), out = { W: p.W, H: p.H, rows: [], cols: [] };
    for (var y = 0; y < p.H; y++) out.rows.push(runs(rowOf(p.cells, p.W, y)));
    for (var x = 0; x < p.W; x++) out.cols.push(runs(colOf(p.cells, p.W, p.H, x)));
    return out;
  }

  /** Сетка сходится с цифрами? */
  function check(grid, cl) {
    var W = cl.W, H = cl.H, y, x;
    if (!grid || grid.length !== W * H) return false;
    for (y = 0; y < H; y++) if (!same(runs(rowOf(grid, W, y)), cl.rows[y])) return false;
    for (x = 0; x < W; x++) if (!same(runs(colOf(grid, W, H, x)), cl.cols[x])) return false;
    return true;
  }
  /** Какие строки/столбцы уже сходятся (для гаснущих цифр). */
  function lineStatus(grid, cl) {
    var W = cl.W, H = cl.H, rows = [], cols = [], y, x;
    for (y = 0; y < H; y++) rows.push(same(runs(rowOf(grid, W, y)), cl.rows[y]));
    for (x = 0; x < W; x++) cols.push(same(runs(colOf(grid, W, H, x)), cl.cols[x]));
    return { rows: rows, cols: cols };
  }

  /**
   * Все расстановки групп clue в линии длины n, совместимые с known (-1 неизвестно, 0 пусто, 1 закрашено).
   * Возвращает { can1, can0 } по клеткам или null, если расстановок нет.
   */
  function lineOptions(n, clue, known) {
    var can1 = new Array(n).fill(false), can0 = new Array(n).fill(false), any = false;
    var cur = new Array(n).fill(0);
    function place(j, from) {
      if (j === clue.length) {
        for (var k = from; k < n; k++) if (known[k] === 1) return;
        for (var m = 0; m < n; m++) { if (cur[m]) can1[m] = true; else can0[m] = true; }
        any = true;
        return;
      }
      var len = clue[j], rest = 0;
      for (var q = j + 1; q < clue.length; q++) rest += clue[q] + 1;
      for (var s = from; s + len + rest <= n; s++) {
        // клетки from..s-1 пустые
        if (s > from && known[s - 1] === 1) break;
        var ok = true, i;
        for (i = s; i < s + len; i++) if (known[i] === 0) { ok = false; break; }
        if (ok && s + len < n && known[s + len] === 1) ok = false;
        if (ok) {
          for (i = s; i < s + len; i++) cur[i] = 1;
          place(j + 1, s + len + 1);
          for (i = s; i < s + len; i++) cur[i] = 0;
        }
      }
    }
    place(0, 0);
    return any ? { can1: can1, can0: can0 } : null;
  }

  /** Решатель по линиям. { grid: -1/0/1, solved, contradiction, steps } */
  function lineSolve(cl) {
    var W = cl.W, H = cl.H, g = new Array(W * H).fill(-1), changed = true, steps = 0;
    function apply(idx, clue) {
      var known = idx.map(function (i) { return g[i]; });
      var o = lineOptions(idx.length, clue, known);
      if (!o) return null;
      var ch = false;
      for (var k = 0; k < idx.length; k++) {
        if (g[idx[k]] !== -1) continue;
        if (o.can1[k] && !o.can0[k]) { g[idx[k]] = 1; ch = true; }
        else if (o.can0[k] && !o.can1[k]) { g[idx[k]] = 0; ch = true; }
      }
      return ch;
    }
    var rIdx = [], cIdx = [], y, x;
    for (y = 0; y < H; y++) { rIdx.push([]); for (x = 0; x < W; x++) rIdx[y].push(y * W + x); }
    for (x = 0; x < W; x++) { cIdx.push([]); for (y = 0; y < H; y++) cIdx[x].push(y * W + x); }
    while (changed) {
      changed = false; steps++;
      for (y = 0; y < H; y++) { var r = apply(rIdx[y], cl.rows[y]); if (r === null) return { grid: g, solved: false, contradiction: true, steps: steps }; if (r) changed = true; }
      for (x = 0; x < W; x++) { var c = apply(cIdx[x], cl.cols[x]); if (c === null) return { grid: g, solved: false, contradiction: true, steps: steps }; if (c) changed = true; }
    }
    return { grid: g, solved: g.indexOf(-1) === -1, contradiction: false, steps: steps };
  }

  return { runs: runs, same: same, parse: parse, mirror: mirror, cluesOf: cluesOf, check: check, lineStatus: lineStatus, lineOptions: lineOptions, lineSolve: lineSolve, rowOf: rowOf, colOf: colOf };
});
