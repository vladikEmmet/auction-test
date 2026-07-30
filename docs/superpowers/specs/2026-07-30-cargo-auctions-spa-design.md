# Дизайн: SPA грузовых аукционов

Дата: 2026-07-30
Источник правды по API: `openapi/openapi.auctions.v0.json` (копия выданной схемы).

## Цель

SPA для работы с грузовыми аукционами: список с фильтрами и пагинацией, детальная
страница, история ставок, установка своей ставки. Бэкенд заменён MSW-моками, которые
реально мутируют состояние.

## Стек

React 19, TypeScript (strict), Vite, TanStack Router, TanStack Query v5,
React Hook Form + Zod v4, MSW v2, Zustand, Tailwind CSS v4 + shadcn/ui (Radix),
Vitest + Testing Library.

Решения, зафиксированные с заказчиком:
- UI — shadcn/ui поверх Radix + Tailwind (компоненты копируются в `shared/ui`).
- Клиентский UI-state — Zustand.
- Фильтры — URL search params (без localStorage-персиста).
- Режим ставки — отдельный роут, отрисованный модалкой над деталкой (на mobile — полный экран).

## Слои (Feature-Sliced Design)

```
openapi/openapi.auctions.v0.json   схема, читается contract-тестом
src/
  app/        providers (QueryClient, RouterProvider, Toaster), routeTree, глобальные стили
  pages/      auctions-list | auction-detail | auction-bet
  widgets/    auctions-filters | auction-card | auction-summary | bets-table
  features/   filter-auctions (search params schema + request builder)
              set-bet (RHF+Zod форма, mutation, zustand-стор UI)
  entities/   auction (DTO, VM-мапперы, queryOptions), bet (DTO, VM, queryOptions)
  shared/     ui (shadcn), lib (format, dates, enum-словари), api (client, ApiError, msw), config
```

Правило импортов: слой видит только слои ниже себя. Проверяется ESLint-правилом
`import/no-restricted-paths` (или эквивалентной конфигурацией `no-restricted-imports`).

Все файлы React-компонентов имеют суффикс `*.component.tsx` (требование ТЗ).

## Контракты API

DTO описываются Zod-схемами вручную в `entities/*/model/*.dto.ts`, типы выводятся через
`z.infer`. Схема OpenAPI при этом остаётся источником правды: contract-тест читает
`openapi/openapi.auctions.v0.json` и сверяет со схемами Zod:

- все значения enum'ов (`AuctionType`, `AuctionStatus`, `TradingStatus`,
  `BidMeasurementType`, `OperationType`, `PaymentDelayType`, а также enum'ы фильтров
  `status` и `auc_type` в `AuctionListRequest`);
- набор ключей объектных схем (`AuctionListItem*`, `AuctionShow*`, `BetItem*`,
  `ProblemDetail`, `ValidationProblem`, `SetBetRequest`);
- nullable-поля: поле, помеченное `nullable: true` в схеме, обязано допускать `null` в Zod.

В dev-режиме ответы дополнительно прогоняются через `safeParse`; расхождение печатается
в консоль как warning, но не ломает UI (реальный upstream может слать лишние поля).

Все DTO-схемы используют «мягкий» разбор: неизвестные ключи игнорируются, незнакомые
значения enum'ов схлопываются в `Unknown` (в схеме это легальное значение).

## Эндпоинты

| Метод | Путь | Использование |
|---|---|---|
| POST | `/api/v1/auctions/list` | список, фильтры + `page`/`per_page` в теле |
| GET | `/api/v1/auctions/{auctionUuid}` | детальная карточка |
| GET | `/api/v1/auctions/{auctionUuid}/bets?all=` | список ставок, `all=true` — включая отменённые |
| POST | `/api/v1/auctions/{auctionUuid}/bets` | установка ставки, тело `{ price: number }` |

Ответ `POST /bets` в схеме не типизирован («проксируется от upstream»). Мок возвращает
созданный `BetItem`; клиент на тело ответа не опирается — только инвалидирует кэш.

## Маршруты

| Роут | Содержимое |
|---|---|
| `/` | редирект на `/auctions` |
| `/auctions` | список: фильтры, пагинация, skeleton/empty/error, prefetch деталки по hover/focus |
| `/auctions/$auctionUuid` | деталка + вкладка «Ставки» |
| `/auctions/$auctionUuid/bet` | форма ставки поверх деталки (модалка / full-screen на mobile) |

Закрытие модалки ставки — `navigate` на родительский роут, история браузера сохраняется.

## Список аукционов

Search params валидируются Zod-схемой с `.catch()` на каждом поле: некорректное значение
(`?page=abc`, `?statuses=НЛО`) молча заменяется дефолтом, страница не падает.

Фильтры (минимум по ТЗ): `cargo_num`, `status` (торговый статус пользователя, мультивыбор),
`statuses` (статус аукциона, мультивыбор), `auc_type` (мультивыбор), `load_city`,
`unload_city` (из мок-словаря городов), `load_date_from`/`load_date_to`, `is_available`,
`is_bidder`, `current_price_from`/`current_price_to`. Плюс `page`, `per_page`, `sort`.

`statuses` в API — числовые (1–8). В URL хранятся читаемые строковые ключи
(`Planning`, `Auction`, …), маппинг в числа выполняет request builder — чистая функция
`buildListRequest(searchParams): AuctionListRequest`, покрытая тестами.

Даты в URL хранятся как `YYYY-MM-DD`, в запрос уходят в формате ISO 8601 со смещением
(как требует `pattern` в схеме): `from` → начало дня, `to` → конец дня.

Prefetch: `onMouseEnter`/`onFocus` на карточке вызывает `queryClient.prefetchQuery`
для деталки и `router.preloadRoute`.

## Карточка аукциона

Показывает: номер заявки, тип аукциона, статус аукциона, торговый статус пользователя,
маршрут погрузка → выгрузка, даты погрузки/разгрузки, груз (название, вес, объём, тип
кузова), текущую цену, цену за км, шаг ставки, флаг наличия своей ставки и primary action.

Primary action вычисляется чистой функцией `getPrimaryAction(item)`:

| Условие | Действие |
|---|---|
| `can_set_bet && your.bet` | «Изменить ставку» → `/auctions/$uuid/bet` |
| `can_set_bet && !your.bet` | «Сделать ставку» → `/auctions/$uuid/bet` |
| `!can_set_bet && is_bidder` | «Смотреть ставки» → деталка, вкладка ставок |
| иначе | disabled-кнопка с причиной в tooltip |

## Детальная страница

Основные данные, организатор, контакты (если `hide_points_address_and_contacts=false`),
маршрут со всеми точками из `routes[]`, груз и требования к ТС (`cargo.car`), условия
оплаты, параметры торгов (`trading.settings`), цены (`current`, `available`, `min`, `max`,
`step` — с НДС и без), состояние своей ставки.

Ограничения из DTO отображаются явными плашками, а не молчаливым скрытием:
- `hide_points_address_and_contacts` — адреса и контакты заменяются на «скрыто организатором»;
- `no_view_cargo_price` — цена груза скрыта;
- `hide_bets_history` — вкладка ставок показывает состояние «история скрыта» и не делает запрос;
- `can_set_bet=false` — кнопка ставки disabled с пояснением.

## Ставки

`GET /auctions/{uuid}/bets`, переключатель «показывать отменённые» → `all=true`.
Таблица: перевозчик, цена с НДС / без НДС (переключатель единицы — Zustand),
место в рейтинге, признак победителя, признак отменённой ставки + причина,
количество участников (уникальные `organization_id`), empty state.

При `hide_bets_history=true` запрос не выполняется, показывается объяснение.

## Установка ставки

Ограничения считает одна чистая функция `getBetConstraints(detail)`, которую использует
и форма, и MSW-хендлер — поэтому 422 от мока воспроизводим и согласован с клиентской
валидацией:

| `auc_type` | Правило |
|---|---|
| `Down` | цена ≤ `available` (или `current`, если `available` = null), кратна `step` |
| `Up` | цена ≥ `available` (или `current`), кратна `step` |
| `FixPrice` | цена = `available` ?? `current` |
| `Request`, `Unknown` | цена > 0, при наличии — в пределах `min`/`max` |

Общие правила для всех типов: цена обязательна, > 0, если заданы `min`/`max` — в их
пределах. `step` применяется только если он задан и > 0.

Форма: React Hook Form + `zodResolver`, схема строится динамически из `getBetConstraints`.
Доступность формы — `trading.can_set_bet`. Подсказки: доступная цена, шаг, min/max,
единица измерения (`bid_measurement_type`: за рейс / за км).

Мутация → `POST /bets`. При успехе: `invalidateQueries` для list/detail/bets + success-toast.
При 422: `ValidationProblem.errors[]` раскладывается по полям формы через `setError`
(поле `price` → на инпут; неизвестные поля → в общий алерт формы) + error-toast.

MSW при принятой ставке: добавляет `BetItem`, пересчитывает `place` по всем активным
ставкам, обновляет `trading.price.current`/`current_no_vat`/`available`/`price_per_km`,
ставит `your.bet=true`, `your.last_bet`, переводит `status_mobile` пользователя в `Leading`,
а прежнего лидера — в `Losing`. Изменения видны и в списке, и в деталке, и в ставках.

## Ошибки

`ProblemDetail` и `ValidationProblem` парсятся в типизированный `ApiError`
(`status`, `code`, `title`, `message`, `traceId`, `errors[]`). Сетевые ошибки и
непарсящееся тело дают `ApiError` с `code: 'unknown_error'`.

Ретраи TanStack Query: до 2 раз для GET-запросов, никогда для 4xx.
Ошибка списка → error state с кнопкой «Повторить». Ошибка деталки 404 → not-found экран.

## Мок-данные

`shared/api/msw/`: `store.ts` (in-memory БД + мутации), `seed.ts` (детерминированный
генератор, ~60 аукционов, фиксированный PRNG), `handlers.ts`, `dictionaries.ts` (города).

Сид намеренно покрывает edge cases: `hide_bets_history`, `hide_points_address_and_contacts`,
`no_view_cargo_price`, `can_set_bet=false`, `trading.price=null`, `trading.your=null`,
`cargo.car=null`, аукцион без ставок, отменённая ставка с `cancel_reason`, все четыре
`auc_type`, весь диапазон `status`/`status_mobile`, значения `Unknown`, `price_per_km=null`.

Первые несколько аукционов имеют стабильные UUID и предсказуемые свойства, чтобы
проверяющий мог зайти по прямой ссылке.

## Тестирование

Unit (Vitest):
- парсинг search params, включая мусорные значения и fallback'и;
- `buildListRequest` — маппинг статусов в числа, форматирование дат, отбрасывание пустых полей;
- VM-мапперы списка и деталки — nullable-поля, скрытые контакты, отсутствующие цены;
- `getBetConstraints` + Zod-схема ставки по всем типам аукциона;
- мутации MSW-стора (пересчёт `place`, смена статусов);
- contract-тест DTO против `openapi.auctions.v0.json`.

Интеграционные (Testing Library + MSW node server):
- список рендерится, пустой результат даёт empty state;
- успешная ставка обновляет деталку и список ставок.

## Что осознанно не делается (YAGNI)

Авторизация и Bearer-токен (в схеме нет securitySchemes), избранное, чат, сортировка
по нескольким полям одновременно, бесконечный скролл, i18n, SSR, темизация light/dark
сверх дефолта Tailwind.
