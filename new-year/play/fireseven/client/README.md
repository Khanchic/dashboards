# Клиент игры Crack the 777 Vault (Fire Seven) для приложения Witching Hours

Готовый клиент механики `vault777` по контракту `WH.register` (как `public/games/code.js`). Сервер — модуль
`../engine/wh-adapter.js` (план подключения — `../engine/INTEGRATION.md`). Перенесён с макета `../index.html#mock`
и проверен в `preview.html` (без сервера, в браузере). Общий код приложения здесь не правился.

## Файлы

| Файл | Что |
|---|---|
| `vault.js` | Клиент: вкладки 7 замков, полоска семёрок с отсчётом, клавиши-символы с подсветкой, 4 барабана, история попыток, дворецкий, обучение из 3 шагов, экраны «закрыто» и «вскрытие» с призом, оффером и клипом |
| `vault.css` | Стили, все под корнем `.f7v` (в хаб не протекают). Телефон: на 390×844 видно вкладки, семёрки, символы, барабаны, кнопки и 2 последние попытки |
| `preview.html` | Предпросмотр без сервера: настоящие `hub-core.js` и `hub.css` из app (только чтение) + порт движка в браузере |

## Как подключить (основной чат)

1. Скопировать `vault.js` и `vault.css` в `halloween-week/app/public/games/`, ассеты `../assets/` (папки `art/`, `promo/`,
   `android.png`, `butler.png`) — например в `public/assets/fireseven/`.
2. В `public/index.html:146-153` рядом с остальными играми:
   ```html
   <link rel="stylesheet" href="/games/vault.css">
   <script>window.F7V_CONFIG = { assetBase: '/assets/fireseven/', claimUrl: null, onClaim: null, offerUrl: null, revealVideo: null };</script>
   <script src="/games/vault.js"></script>
   ```
3. Сервер — по `../engine/INTEGRATION.md` (модуль `vault777`, один конкурс 12:00–23:30 ET 25.12).

`F7V_CONFIG`:

| Ключ | Что | По умолчанию |
|---|---|---|
| `assetBase` | путь к ассетам F7, там ищутся `art/sym-<id>.jpg`, `art/android-midnight.jpg` | `/assets/fireseven/` |
| `onClaim(ctx)` | функция Claim prize (ctx: `prize`, `view`, `brand`) — подключить к существующему Claim | — |
| `claimUrl` | если `onClaim` нет: ссылка для кнопки Claim prize (иначе — Discord бренда из `WH.st.brand`) | — |
| `offerUrl` | строка или `fn(offer)` → ссылка на личный оффер; без неё кнопки оффера нет | — |
| `revealVideo` | клип вскрытия, напр. `/assets/fireseven/art/clip-16x9.mp4`; без него показывается стоп-кадр `android-midnight.jpg` | — |
| `revealAfterCloseMin` | запасной расчёт вскрытия, если сервер не прислал `reveal` | 30 |

## Что клиент ждёт от сервера

- `view` из `wh-adapter.view()`: `opens`, `close`, **`reveal`**, `locks[]`, `total`.
- **После вскрытия — `view.prize`** = `vault-event.prizeFor(userId, results, top)`. Модуль сам его не знает: топ-3 считается
  по всем игрокам. Пока `prize` нет, клиент показывает запасной вариант (промокод 5 FP + 100K GC и оффер по числу
  замков) и раз в 1.5–4 с перезапрашивает состояние.
- Ошибки ходов (`lock_not_open`, `closed`, `too_fast`, `repeat_symbol`, `butler_unavailable`…) показываются игроку
  мягким текстом.

## Хуки и что решить при подключении

- **Claim prize** — `onClaim` или `claimUrl`, иначе кнопка ведёт в Discord бренда.
- **Оффер** — `offerUrl`; покупки идут в админке, клиент только показывает ссылку.
- **Таймер в шапке хаба** — его ведёт хаб, не клиент. После вскрытия в `preview.html` он показывает «Opens in 00:00»
  (это мини-хаб предпросмотра); в бою проверить, что хаб после 00:00 не показывает отсчёт.
- **Лидерборд** в правой панели хаба — по решению ивента топ-3 объявляется постом после ручной проверки, таблицу до
  этого не показываем («The board opens at midnight»).
- **Ассеты тяжёлые**: `sym-*.jpg` ~500 КБ × 8 (1024 px) при показе 40–90 px. Перед боем пережать до 256 px (~30 КБ).

## Предпросмотр

Открыть `preview.html` в браузере. Параметры адреса:
`t=1100|1210|1420|1810|2100|2330|0000` — время ET; `start=1` — сразу начать; `demo=N` или `N.K` — N замков открыто,
на следующем K промахов; `tut=0|1` — обучение уже видели / показать; `frame=390&h=844` — страница в iframe шириной телефона.
Внизу панель кнопок времени, «Crack current lock», «Reset tutorial», «New vault». Зелёная метка «JS OK» — ошибок нет.

Проверено 12.11 в headless Edge: 1280 px и 390 px; состояния — обучение, взлом (12:10, 14:20), закрытие 23:30,
вскрытие 00:00 со стоп-кадром; ошибок JS нет.
