/**
 * Подозрительно быстрые стены — ТОЛЬКО лог для ручного разбора после эфира (04.01, вместе с export).
 * На призы не влияет, автоматических банов нет: скорость в ивенте ничего не решает (общее правило 10).
 *
 * Флаг ставится, если выполнено любое из двух:
 *   1) время от открытия стены до решения < 0,3 с на клетку (5×5 → 7,5 с, 10×10 → 30 с, мурал 10×12 → 36 с).
 *      Время от открытия — верхняя граница настоящего времени решения, поэтому «открыл и ушёл» флаг не даёт;
 *   2) вся стена пришла 1–2 пачками при 30+ закрашенных клетках: клиент шлёт пачку раз в 0,3 с, и человек
 *      столько клеток так быстро не нарисует — похоже на скрипт, который шлёт готовый ответ прямо в API.
 * Практика не проверяется (там нет приза).
 */
const SEC_PER_CELL = 0.3;
const MIN_CELLS_FOR_BATCH_FLAG = 30;

function fastSolve({ W, H, ms, moves, filled, practice }) {
  if (practice) return null;
  const reasons = [];
  const limit = W * H * SEC_PER_CELL * 1000;
  if (Number.isFinite(ms) && ms < limit) reasons.push(`${(ms / 1000).toFixed(1)} s < ${(limit / 1000).toFixed(1)} s`);
  if (Number.isFinite(moves) && moves <= 2 && filled >= MIN_CELLS_FOR_BATCH_FLAG) reasons.push(`${filled} cells in ${moves} batch${moves > 1 ? 'es' : ''}`);
  return reasons.length ? reasons.join(' · ') : null;
}

module.exports = { fastSolve, SEC_PER_CELL };
