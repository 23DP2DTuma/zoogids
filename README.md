# ZooGids — прототип (Laravel + React + Tailwind CSS + Vite)

Интернет-магазин товаров для питомцев с «профилем питомца», «умным фильтром» и калькулятором корма.
Интерфейс на латышском, как в документации.

## Запуск

Требуется: PHP 8.3+, Composer, Node.js 20+.

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite          # Windows: type nul > database\database.sqlite
php artisan migrate --seed
npm install
```

Два терминала:

```bash
php artisan serve        # http://localhost:8000
npm run dev              # Vite + React HMR
```

## Что есть

| Страница | Маршрут | Функции из документации |
|---|---|---|
| Главная | `/` | поиск по проблеме, популярные товары, гайды |
| Каталог | `/katalogs` | поиск, фильтры (категория, бренд, вид, проблема, цена), сортировка, фильтр по активному питомцу (вид + без аллергенов) |
| Товар | `/produkts/:id` | предупреждение об аллергене, порция для активного питомца |
| Gudrais filtrs | `/gudrais-filtrs` | текст → проблемы → товары (LV / RU / EN ключевые слова) |
| Kalkulators | `/kalkulators` | дневная норма (RER = 70 × вес^0.75) и сколько дней хватит упаковки |
| Mani mīluļi | `/mani-miluli` | CRUD питомцев, валидация полей, напоминания, подтверждение удаления |
| Grozs | `/grozs` | корзина, доставка (пакомат / курьер), подписка −10 % на 7–90 дней, заказ |
| Padomi | `/padomi` | статьи с фильтром по виду |

## API (`routes/api.php`)

- `GET /api/meta` — категории, бренды, проблемы
- `GET /api/products?q=&category=&brand=&species=&min_price=&max_price=&sort=&exclude=&problem=`
- `GET /api/products/{id}`
- `POST /api/smart-filter` `{ text, species? }`
- `GET /api/articles?species=`, `GET /api/articles/{id}`
- `POST /api/orders` — сохраняет заказ, `cena_bridi`, уменьшает остаток

## Упрощения прототипа

- Питомцы и корзина хранятся в `localStorage` (в полной версии — таблицы, привязанные к пользователю, + Laravel Sanctum).
- Нет регистрации / входа и админ-панели (тестовый админ создаётся сидером: `admin@zoogids.lv` / `Admin2026!`).
- «Умный фильтр» работает по ключевым словам; место для вызова AI-модели — `SmartFilterController`.
- Картинки товаров — эмодзи; данные для сидера — `database/seeders/data/catalog.json`.

## Структура

```
app/Http/Controllers/Api/   CatalogController, SmartFilterController, ArticleController, OrderController
app/Models/                 Category, Brand, Problem, Product, Article, Order, OrderItem
database/migrations/        2026_10_01_000001_create_catalog_tables.php
resources/js/               app.jsx, lib/ (api, store), components/, pages/
resources/css/app.css       Tailwind v4 тема
```
