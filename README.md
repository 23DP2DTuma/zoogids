# ZooGids — магазин товаров для питомцев (Laravel 12 + React 19 + Tailwind CSS 4 + Vite 7)

Интернет-магазин с профилями питомцев, «умным фильтром», калькулятором корма, подписками и админ-панелью.
Архитектура: React SPA (одна Blade-страница `resources/views/app.blade.php`) + JSON REST API `/api/*`,
аутентификация — Laravel Sanctum (SPA, cookie-сессия + CSRF). Интерфейс: латышский (по умолчанию), английский, русский.

## Требования

PHP 8.2+, Composer, Node.js 20+, MySQL 8 (Laragon). База `zoo_gids`, кодировка `utf8mb4` (в enum-значениях латышские буквы).

## Запуск с нуля (Windows + Laragon, PowerShell)

```powershell
cd C:\Users\tuman\Desktop\zoogids
composer install
Copy-Item .env.example .env        # если .env ещё нет
php artisan key:generate
# в Laragon создать БД: CREATE DATABASE zoo_gids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
php artisan migrate:fresh --seed
php artisan storage:link
npm install
npm run dev                         # Vite (HMR), оставить открытым
```

Во втором окне: `php artisan serve` → http://localhost:8000 (или виртуальный хост Laragon http://zoogids.test).

Важные настройки `.env`:

```dotenv
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=zoo_gids
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=database
FILESYSTEM_DISK=public
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000,zoogids.test,localhost:5173,127.0.0.1:5173
SMART_FILTER_DRIVER=keywords        # или llm
LLM_API_KEY=                        # ключ OpenAI-совместимого API (для llm)
```

Подписки: `php artisan subscriptions:process` (в расписании — ежедневно в 06:00; локально `php artisan schedule:work`).

## Демо-аккаунты

| Роль | E-mail | Пароль |
|---|---|---|
| Администратор | admin@zoogids.lv | Admin2026! |
| Пользователь (2 питомца, заказы, подписка) | anna@mail.com | Anna2026! |
| Покупатели с отзывами | janis@mail.com, liga@mail.com, oskars@mail.com | Demo2026! |

## Страницы

| Маршрут | Назначение |
|---|---|
| `/` | главная, поиск по проблеме, популярные товары |
| `/katalogs` | поиск, фильтры, сортировка, пагинация «Ielādēt vēl», фильтр по активному питомцу |
| `/produkts/:id` | товар, предупреждения об аллергене/виде, порция, отзывы |
| `/gudrais-filtrs` | умный фильтр (текст → проблемы → товары) |
| `/kalkulators` | калькулятор корма (питомцы с сервера / ручной ввод для гостя) |
| `/padomi`, `/padomi/:id` | статьи |
| `/grozs` | корзина и оформление (пакомат/курьер, подписка −10 %, mock-оплата) |
| `/pasutijums/:id` | подтверждение / детали заказа |
| `/pieslegties`, `/registreties` | вход / регистрация (возврат на `?next=`) |
| `/profils` | профиль, пароль, удаление аккаунта, питомцы + напоминания, заказы, подписки, мои отзывы |
| `/admin/*` | админ-панель: статистика, CRUD, статусы, модерация |
| `/403`, `*` | страница «доступ запрещён», 404 |

## API (кратко)

Публичные: `GET /api/meta`, `GET /api/products`, `GET /api/products/{id}`, `POST /api/smart-filter`,
`GET /api/articles[/{id}]`, `GET /api/lockers`, `POST /api/register`, `POST /api/login`.

Пользователь (`auth:sanctum`): `GET|PUT|DELETE /api/user`, `PUT /api/user/password`, `POST /api/logout`,
`/api/pets` (CRUD), `/api/pets/{pet}/reminders`, `/api/reminders/{id}`, `GET /api/reminders/upcoming`,
`/api/cart`, `/api/cart/items[/{product}]`, `POST /api/cart/merge`, `GET|POST /api/orders`, `GET /api/orders/{id}`,
`GET /api/subscriptions`, `PUT /api/subscriptions/{id}`, `/api/products/{id}/reviews`, `/api/reviews/{id}`, `GET /api/reviews/mine`.

Администратор (`auth:sanctum` + `admin`): `/api/admin/dashboard`, `products`, `categories`, `brands`, `problems`,
`articles`, `users`, `orders`, `subscriptions`, `reviews`.

## Структура

```
app/Http/Controllers/Api/         публичные и пользовательские контроллеры
app/Http/Controllers/Api/Admin/   админ-контроллеры
app/Http/Requests/                FormRequest-валидация (Admin/, Auth/)
app/Policies/                     Pet, Reminder, Order, Subscription, Review
app/Services/OrderService.php     оформление заказа (транзакция + lockForUpdate)
app/Services/SmartFilter/         KeywordMatcher (по умолчанию) и LlmMatcher (опционально)
app/Console/Commands/             subscriptions:process
config/lockers.php                статический список пакоматов
lang/{lv,en,ru}/                  тексты ошибок API (заголовок X-Locale)
resources/js/lang/                словари интерфейса lv / en / ru
resources/js/components/          Layout, Modal/Field, ConfirmDialog, Guards, StatusBadge, admin/CrudPage
resources/js/pages/               страницы SPA, pages/admin/ — админка
```

## Упрощения

- Оплата — имитация (кнопка «Maksāt» → успех), реального платёжного провайдера нет.
- Пакоматы — статический список в `config/lockers.php`, без API Omniva/DPD.
- LLM-драйвер умного фильтра опционален; при ошибке или без ключа используется поиск по ключевым словам.
- Автотесты по заданию не пишутся; основные сценарии проверены вручную.
