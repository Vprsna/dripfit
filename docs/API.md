# Drip Fit — REST API

Базовый адрес: `http://localhost:8000/api`. Все ответы — JSON. Ошибки: `{"error": "текст"}` с кодом 400/401/404/409.

Авторизация: после `register`/`login` приходит `token`. Его передают в заголовке
`Authorization: Bearer <token>`. Адреса с пометкой 🔒 требуют токен.

## Учётная запись

| Метод | Адрес | Тело / параметры | Ответ |
|---|---|---|---|
| POST | `/auth/register` | `{login, email, password, name?}` | `201 {token, user}` |
| POST | `/auth/login` | `{login (ник или почта), password}` | `{token, user}` |
| POST | `/auth/logout` 🔒 | — | `{ok}` |
| GET | `/me` 🔒 | — | профиль |
| PUT | `/me` 🔒 | `{name?, height?, weight?, goal?, avatar?, password?, fits?}` | профиль |
| DELETE | `/me` 🔒 | — | удаляет аккаунт со всеми данными |
| GET | `/users?q=` | поиск по нику | список пользователей |
| GET | `/users/<login>` | — | публичный профиль + статистика за 7 дней |

## Упражнения

| Метод | Адрес | Параметры | Ответ |
|---|---|---|---|
| GET | `/exercises` | `q` — название или мышца, `group` — раздел/мышца, `limit` | список |
| GET | `/exercises/<id>` | — | название, тип, раздел, мышцы, описание, шаги, частая ошибка, видео |

Типы упражнений: `wr` подходы×повторы×вес, `bw` с весом тела, `hold` удержание (секунды), `time` минуты, `cardio` км+минуты, `cm`/`kg`/`pct` замеры.

## Результаты занятий 🔒

Поля записи: `ex` (id упражнения), `d` (дата `ГГГГ-ММ-ДД`, по умолчанию сегодня), `s` подходы, `r` повторы/секунды, `w` вес, `min` минуты, `km` дистанция, `v` замер.

| Метод | Адрес | Тело / параметры |
|---|---|---|
| GET | `/logs?from=&to=` | история за период |
| POST | `/logs` | `{ex, d?, s?, r?, w?, min?, km?, v?}` → `201` |
| PUT | `/logs/<id>` | любые поля записи |
| DELETE | `/logs/<id>` | — |

## Тренировки 🔒

| Метод | Адрес | Тело |
|---|---|---|
| GET | `/workouts` | — |
| POST | `/workouts` | `{name, items?: [{ex, s?, r?, w?, …}]}` → `201` |
| GET | `/workouts/<id>` | — |
| PUT | `/workouts/<id>` | `{name?, items?}` (items заменяет весь состав) |
| DELETE | `/workouts/<id>` | — |
| POST | `/workouts/<id>/items` | `{ex, s?, r?, w?…}` — добавить упражнение |
| DELETE | `/workouts/<id>/items/<item_id>` | убрать упражнение |
| POST | `/workouts/<id>/complete` | записать все упражнения в результаты за сегодня; `+50` фитов один раз в день |

## Прогресс, рейтинг, фиты

| Метод | Адрес | Параметры | Ответ |
|---|---|---|---|
| GET | `/stats` 🔒 | `days` (1–365, по умолчанию 7) | тоннаж, дни, км, минуты, по дням, личные рекорды |
| GET | `/rating` | `metric` = `fits` · `ton` · `days` · `km` · `streak`; `days` | `{top: [{place, login, name, value}], me}` |
| POST | `/fits/daily` 🔒 | — | отметка тренировки: `+50` фитов раз в день, серия |

## Друзья 🔒

| Метод | Адрес | Тело |
|---|---|---|
| GET | `/friends` | — → `{friends, incoming, outgoing}` |
| POST | `/friends` | `{login}` — заявка (если он уже звал — сразу дружба) |
| POST | `/friends/<login>/accept` | — |
| DELETE | `/friends/<login>` | удалить друга / отклонить / отменить заявку |

## Достижения 🔒

| Метод | Адрес | Ответ |
|---|---|---|
| GET | `/achievements` | `[{id, name, progress, goal, reward, done, claimed}]` |
| POST | `/achievements/<id>/claim` | `{reward}` — фиты начисляются, если выполнено |

## Синхронизация сайта 🔒

| Метод | Адрес | Описание |
|---|---|---|
| GET | `/sync` | все данные сайта пользователя (`df-log`, `df-workouts`, `df-plans`, `df-food`…) |
| PUT | `/sync/<ключ>` | сохранить ключ; `df-log` и `df-workouts` раскладываются по таблицам |

## Магазин

| Метод | Адрес | Описание |
|---|---|---|
| GET | `/shop/music` | фоновая музыка: `{lofi: {title, url, embed}}` (адрес из `config.json` → `lofi_url`) |
| POST | `/shop/buy` 🔒 | `{id}` — купить товар за фиты (`lofi` — 3000), покупка сохраняется в аккаунте |

## Внешние сервисы

| Метод | Адрес | Описание |
|---|---|---|
| GET | `/youtube/search?q=` | YouTube Data API v3 (ключ в `config.json`); без ключа — видео из библиотеки + ссылка на поиск |
| GET | `/music/search?q=` | iTunes Search API: трек, исполнитель, обложка, 30-сек. отрывок, ссылка на Яндекс Музыку |
| GET | `/health` | проверка, что сервер жив |

## База данных (SQLite)

`users` · `sessions` · `logs` · `workouts` · `workout_items` · `friends` · `achievements` · `kv` (прочие данные сайта).
Схема — в начале `server/app.py`.

## Пример (PowerShell)

```powershell
$r = Invoke-RestMethod -Method Post http://localhost:8000/api/auth/login -ContentType 'application/json' -Body '{"login":"artem_pro","password":"demo123"}'
Invoke-RestMethod http://localhost:8000/api/stats -Headers @{Authorization = "Bearer $($r.token)"}
```
