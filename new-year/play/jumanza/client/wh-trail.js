/*
 * Обёртка механики 'trail' под хаб общего слоя (формат Witching Hours: WH.register(id, { mount })).
 * Хаб отдаёт попытку конкурса (attempt.view) и функцию хода; тропа рисуется Trail.mount, карта горы — Mountain.render
 * (её хаб рисует сам по списку конкурсов бренда: id, n, title, zone, status, can).
 * Нужны: shared/jam.js, client/trail-game.js (+ .css), client/mountain.js (+ .css), спрайты assets/sprites/*.webp.
 */
(function (root) {
  if (!root.WH || !root.WH.register) return;
  root.WH.register('trail', {
    mount: function (el, ctx) {
      // ctx: { attempt, move(input) → Promise<{attempt, error}>, onDone(), assetsBase }
      var g = root.Trail.mount(el, {
        sprites: (ctx.assetsBase || '../../jumanza/assets/') + 'sprites/',
        move: ctx.move,
        onDone: ctx.onDone,
      });
      g.load(ctx.attempt);
      return g;
    },
  });
})(typeof window !== 'undefined' ? window : this);
