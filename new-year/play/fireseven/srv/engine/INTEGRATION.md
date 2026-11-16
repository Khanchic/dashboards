# Crack the 777 Vault → приложение Witching Hours: что поменять (для основного чата)

Механика Fire Seven готова и протестирована в `new-year-2026/fireseven/engine/` (`node engine/test.js` — 19 тестов).
Этот файл — план подключения к общему слою на базе `halloween-week/app`. Ссылки на строки — по состоянию на 11.11.
Общий код в этом чате не трогали (правило параллельной работы).

## Главное решение: весь сейф = один конкурс

В WH в каждый момент открыт один contest (`src/web/server.js:172-179` отдаёт 409 на чужой `contest`), а у нас
с 18:00 до 23:30 открыты все 7 замков. Поэтому сейф — **один contest `vault777` с окном 12:00–23:30 ET**, замки и
их расписание внутри `state`. Одна строка `attempts` на игрока (`UNIQUE(brand, contest_id, discord_id)`, `src/db.js:54`)
и есть его сейф. Модуль — `engine/wh-adapter.js` (интерфейс как у `codebreaker.js`, плюс `finalize`).

## Шаги

| # | Где | Что сделать |
|---|---|---|
| 1 | `src/contests/index.js` | `MODULES.vault777 = require('…/fireseven/engine/wh-adapter')` (скопировать `engine/` в app, напр. `src/contests/vault777/`), `NAMES.vault777 = 'Crack the 777 Vault'`, `PARAMS.vault777 = (p) => ({ opens: p.opens, close: p.close })`. |
| 2 | `src/schedule.js:29-49` | Отдельное расписание для рождественского ивента (общая рамка 11.11: замки 25.12, вскрытие 26.12 00:00 ET): одна запись `{ id: 'f7-vault', date: '2026-12-25', list: [['vault777', {}]] }`, окно 12:00 → 23:30 ET (690 мин, нестандартно — сейчас окна 25/40 мин). В params положить `opens/close` из `vault-event.makeSchedule()`; при `DEMO_START/DEMO_HOUR_MINUTES` — `wh-adapter.scheduleFromWindow(start, end)`. |
| 3 | `src/play.js:57,76,83-85` | Ничего не менять: `create(params, rng, {now})`, `move`, `sortKey(result)` совместимы. `ms` нам не нужен (тай-брейк уже в ключе). |
| 4 | `src/scoring.js:59` `closeContest` | `finalize` вызывается в 23:30 — ок. **Но результат, Claim и пост показываем только с `reveal` (26.12 00:00 ET)**: между 23:30 и полночью страница показывает «сейф откроется в полночь» с отсчётом. Очки по местам (50/40/32…) для этого ивента не нужны: призы считает `vault-event.prizeFor`. |
| 5 | `src/prizes.js:20` | Тиры сейчас `daily-1..3`, `week-1..3`. Добавить **`f7-top-1`, `f7-top-2`, `f7-top-3`, `f7-rest`**. Импорт `/wh-codes` (`src/bot/staff.js:37-58`) их тогда примет — шаблон `../codes/codes-template.csv`. |
| 6 | `fillWinners` (`src/prizes.js:65`) + `src/bot/claims.js:41` | Топ-3: как сейчас — `pending` → карточка в desk → `wh:wok`/`wh:wdq` (ручная проверка, решено). Ранжировать `vault-event.rankTop(players, exclude)`; `exclude` — кто уже взял топ в другом бренде (один приз на человека по всем брендам). |
| 7 | `prizes.claim` (`src/prizes.js:110`) | **Новое:** Claim для всех, у кого `result.cracked ≥ 1` и кто не в топ-3 — сразу, без аппрува, тир `f7-rest`. Плюс показать оффер по `vault-event.offerFor(cracked)` (оффер — ссылка/код из админки, лимит 1). |
| 8 | `src/anticheat.js:12,49`, `src/stats.js:19` | Добавить `vault777` в `CHECKS/FAMILY/RULES`. Флаги — только для ручной проверки топ-3 (интервалы попыток, возраст Discord). Без автобанов. |
| 9 | `public/games/` + `public/index.html:146-153` | Новый клиент `vault.js` через `WH.register({ id:'vault', mechanics:['vault777'], … })` (контракт `public/hub-core.js:5-14`). Вёрстка и логика — из макета `fireseven/index.html` (вкладки замков, сейф, легенда, барабаны, история, дворецкий, полночное вскрытие). Ход: `WH.move({ lock, guess })` / `WH.move({ lock, butler:true })`. |
| 10 | Бот (`src/ticker.js`, `src/bot/posts.js`) | Сейчас бот реагирует на `contestOpen/Closed`. Нам нужны **посты по времени** внутри одного конкурса и DM: расписание `../bot/schedule.json` (время UTC, тексты — `../copy/TEXTS.md`). Простой таймер в ticker: раз в 15 с отправить всё, у чего `at <= now` и не отправлено (флаг в kv). DM 21:00 — тем, у кого `cracked < 7`. |
| 11 | `config/brands.json` | Fire Seven уже есть (палитра изумруд+золото с Halloween). Канал ивента — новый `#crack-the-777-vault`. |
| 12 | Экспорт `/wh-export` (`src/export.js`) | Добавить лист «Vault»: discord, player ID, замков, счёт, время последнего замка, по замкам попытки/дворецкий, флаги. По нему проверяют топ-3. |
| 13 | Аналитика (новая таблица `vault_events` или лог в `attempts.state`) | События ниже — без них после ивента не посчитать KPI и не понять, где бросают. Большая часть уже лежит в `state` модуля (попытки с `at`, дворецкий, статус замка) — нужно только сохранить вход/просмотры и выгрузить. |
| 14 | Клиент игры | Готовый клиент по контракту `WH.register` — `../client/` (vault.js, vault.css, README, preview.html). Подключить в `public/index.html:146-153`. Онбординг из 3 шагов при первом входе — внутри клиента. |

## События для аналитики (шаг 13)

| Событие | Когда | Поля | Для чего |
|---|---|---|---|
| `vault_view` | открыл страницу ивента | discord, ts, источник (попап/бродкаст/Discord/FB — из `?src=`) | воронка: пришёл → начал; какой канал работает |
| `tutorial` | шаг онбординга / пропуск | discord, step 1–3, skipped | читают ли объяснение цветов |
| `lock_start` | первая попытка в замке | discord, lock, ts | во сколько приходят, сколько замков начинают |
| `try` | каждая попытка | discord, lock, n, greens, yellows, ts | средние попытки по замкам, сверка с плейтестом и симуляцией |
| `butler` | позвал дворецкого | discord, lock, n | где люди застревают |
| `lock_end` | решил / заклинило | discord, lock, solved, tries, score, ts | доля открывших каждый замок (KPI: все 7 — 35–45%, VII — 55–70%) |
| `quit` | вычисляется после 23:30: последний замок с попытками | discord, lock | где бросают |
| `reveal_view` · `claim` · `offer_click` · `offer_buy` | после вскрытия | discord, cracked, offer | KPI: 70% забрали промокод к 28.12; покупки офферов по числу замков |

Ссылки в попапе, бродкасте, постах Discord и FB — с `?src=popup|broadcast|discord|fb`, иначе канал не посчитать.

## Проверка

- `node fireseven/engine/test.js` — механика.
- Тест-стенд: `DEV_LOGIN=1` + `DEMO_START` + `DEMO_HOUR_MINUTES=10` → замки каждые 10 минут, закрытие через ~115 мин.
  Для репетиции 18.12 (замок каждые 10 мин, закрытие через 80, вскрытие через 90) — `vault-event.rehearsalSchedule()`.
- Чеклист репетиции — `../REHEARSAL.md`.
