/**
 * Сетка «проведи ток» (головоломка типа Net) — общий код сервера и клиента.
 * Сервер: build() генерирует сетку и хранит решение (sol) и поворот (rot) каждой плитки.
 * Клиент: получает только текущие маски (cur) и сам считает ток для мгновенной подсветки;
 * засчитывает дом всё равно сервер.
 *
 * Маска плитки — биты сторон: N=1 E=2 S=4 W=8. Поворот на 90° по часовой: N→E→S→W→N.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LightGrid = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // [dr, dc, bit, opposite bit]
  var DIRS = [[-1, 0, 1, 4], [0, 1, 2, 8], [1, 0, 4, 1], [0, -1, 8, 2]];

  function rot(m, k) { k = ((k % 4) + 4) % 4; while (k--) m = ((m << 1) | (m >> 3)) & 15; return m; }
  function pc(m) { var n = 0; while (m) { n += m & 1; m >>= 1; } return n; }
  function rect(r, c) { var s = '', a = []; for (var j = 0; j < c; j++) s += 'X'; for (var i = 0; i < r; i++) a.push(s); return a; }

  /** Индекс клеток по координатам: "r,c" → i */
  function indexOf(cells) { var at = {}; cells.forEach(function (x, i) { at[x.r + ',' + x.c] = i; }); return at; }

  /**
   * power(cells, masks, src) — какие клетки под током и решена ли сетка.
   * masks[i] — текущая маска клетки i. Решена = ток во всех клетках и нет оборванных концов.
   * При дереве из N клеток это ровно N-1 связей, то есть любое правильное решение.
   */
  function power(cells, masks, src, at) {
    at = at || indexOf(cells);
    var on = {}, q = [src], dang = false, n = 1;
    on[src] = true;
    while (q.length) {
      var i = q.shift(), a = cells[i], m = masks[i];
      for (var d = 0; d < 4; d++) {
        var D = DIRS[d];
        if (!(m & D[2])) continue;
        var j = at[(a.r + D[0]) + ',' + (a.c + D[1])];
        if (j === undefined || !(masks[j] & D[3])) continue;
        if (!on[j]) { on[j] = true; n++; q.push(j); }
      }
    }
    for (var k = 0; k < cells.length && !dang; k++) {
      var b = cells[k], mb = masks[k];
      for (var e = 0; e < 4; e++) {
        var E = DIRS[e];
        if (!(mb & E[2])) continue;
        var jj = at[(b.r + E[0]) + ',' + (b.c + E[1])];
        if (jj === undefined || !(masks[jj] & E[3])) { dang = true; break; }
      }
    }
    return { on: on, count: n, solved: n === cells.length && !dang };
  }

  /**
   * build({ shape, src, star }, rng) — случайное остовное дерево (рандомизированный Прим: много коротких веток,
   * значит много лампочек) + случайные повороты. Никогда не отдаёт уже решённую сетку.
   */
  function build(level, rng) {
    var shape = level.shape, cells = [];
    for (var r = 0; r < shape.length; r++)
      for (var c = 0; c < shape[r].length; c++)
        if (shape[r][c] === 'X') cells.push({ r: r, c: c, sol: 0, rot: 0, par: -1, lock: false, bulb: false, star: false });
    var at = indexOf(cells);
    var src = at[level.src[0] + ',' + level.src[1]];
    if (src === undefined) throw new Error('grid: source outside shape');
    var inT = {}, fr = [];
    function addF(i) {
      var a = cells[i];
      DIRS.forEach(function (D) { var j = at[(a.r + D[0]) + ',' + (a.c + D[1])]; if (j !== undefined && !inT[j]) fr.push([i, j, D[2], D[3]]); });
    }
    inT[src] = true; addF(src);
    while (fr.length) {
      var k = Math.floor(rng() * fr.length), e = fr[k];
      fr[k] = fr[fr.length - 1]; fr.pop();
      if (inT[e[1]]) continue;
      inT[e[1]] = true;
      cells[e[0]].sol |= e[2]; cells[e[1]].sol |= e[3]; cells[e[1]].par = e[0];
      addF(e[1]);
    }
    if (Object.keys(inT).length !== cells.length) throw new Error('grid: shape is not connected');
    cells.forEach(function (x, i) { x.rot = Math.floor(rng() * 4); x.bulb = i !== src && pc(x.sol) === 1; });
    if (level.star) { var s = at[level.star[0] + ',' + level.star[1]]; if (s !== undefined && cells[s].bulb) cells[s].star = true; }
    var g = { R: shape.length, C: shape[0].length, cells: cells, src: src };
    var guard = 0;
    while (solved(g) && guard++ < 100) {
      for (var i = 0; i < cells.length; i++) if (rot(cells[i].sol, 1) !== cells[i].sol) { cells[i].rot += 1 + Math.floor(rng() * 3); break; }
    }
    return g;
  }

  function cur(x) { return rot(x.sol, x.rot); }
  function masksOf(g) { return g.cells.map(cur); }
  function solved(g) { return power(g.cells, masksOf(g), g.src).solved; }
  /** Сколько поворотов по часовой нужно, чтобы плитка встала как в решении (0–3). */
  function stepsToSol(x) { for (var k = 0; k < 4; k++) if (rot(x.sol, x.rot + k) === x.sol) return k; return 0; }

  return { DIRS: DIRS, rot: rot, pc: pc, rect: rect, indexOf: indexOf, power: power, build: build, cur: cur, masksOf: masksOf, solved: solved, stepsToSol: stepsToSol };
});
