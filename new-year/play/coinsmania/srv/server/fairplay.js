/**
 * Подозрительно быстрые банки — ТОЛЬКО лог для ручного разбора после ивента (04.01, вместе с export).
 * На призы не влияет, автоматических банов нет: скорость в ивенте ничего не решает (общее правило 10).
 *
 * Флаг ставится, если выполнено любое из двух:
 *   1) от открытия банки до решения меньше 0,6 с на ход. Ход — это два нажатия (откуда и куда), человек на
 *      такое не способен; время от открытия — верхняя граница, поэтому «открыл и ушёл» флаг не даёт;
 *   2) решено без единого undo и без подсказок ровно за столько ходов, сколько нашёл бы решатель, при 20+ ходах —
 *      похоже на онлайн-решатель (передаётся снаружи как solverPours, если известно).
 * Практика не проверяется (там нет приза).
 */
const SEC_PER_POUR = 0.6;
const MIN_POURS_FOR_SOLVER_FLAG = 20;

function fastSolve({ ms, pours, undos, hints, solverPours, practice }) {
  if (practice) return null;
  const reasons = [];
  const limit = pours * SEC_PER_POUR * 1000;
  if (Number.isFinite(ms) && pours > 0 && ms < limit) reasons.push(`${(ms / 1000).toFixed(1)} s for ${pours} pours`);
  if (Number.isFinite(solverPours) && pours >= MIN_POURS_FOR_SOLVER_FLAG && !undos && !hints && pours === solverPours) reasons.push('solver-exact path');
  return reasons.length ? reasons.join(' · ') : null;
}

module.exports = { fastSolve, SEC_PER_POUR };
