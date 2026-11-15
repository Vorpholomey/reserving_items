# RentShare — Платформа для бронирования предметов

**RentShare** (ранее `reserving_items`) — это веб-платформа для аренды вещей между пользователями. Находите, бронируйте и сдавайте в аренду предметы среди соседей. Экономьте деньги и пространство — используйте то, что нужно, когда нужно.

---

## Содержание

- [Функционал](#функционал)
- [Технологический стек](#технологический-стек)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [Жизненный цикл брони](#жизненный-цикл-брони)
- [API маршруты](#api-маршруты)

---

## Функционал

### Каталог предметов
- Просмотр доступных для аренды предметов с фильтрацией по категориям
- Карточки предметов с описанием, ценой за день, залоком и галереей изображений
- Интерактивная карта с расположением предметов (Leaflet)
- Создание новых предметов с указанием координат, категории и медиафайлов

### Система бронирования
- Создание заявок на бронирование с выбором дат
- Расчёт стоимости: `дни × цена + залог + 10% комиссия`
- Проверка пересечений с существующими бронями
- Полный жизненный цикл брони с отслеживанием статусов

### Жизненный цикл брони
```
PENDING → CONFIRMED → ACTIVE → RETURNED → COMPLETED
   ↓          ↓          ↓
REJECTED    CANCELLED  CANCELLED
```

- **PENDING** — ожидание подтверждения от владельца
- **CONFIRMED** — владелец подтвердил бронирование
- **ACTIVE** — активная аренда (залог удержан)
- **RETURNED** — предмет возвращён
- **COMPLETED** — завершено (залог возвращён)
- **CANCELLED** — отменено
- **REJECTED** — отклонено владельцем

### Чат между пользователями
- Встроенный чат для каждой брони
- Общение между арендатором и владельцем
- Автоматическая подгрузка сообщений (polling)

### Система отзывов
- Оценивание после завершения брони (рейтинг 1-5)
- Текстовые комментарии
- Уникальный отзыв на одну бронь

### Авторизация и профили
- Регистрация и вход по email/паролю
- Профили пользователей с аватаром
- Защищённые маршруты (dashboard, создание предметов)

---

## Технологический стек

| Компонент | Технология |
|---|---|
| **Фреймворк** | Next.js 16 (App Router) |
| **Язык** | TypeScript |
| **UI** | React 19 |
| **Стили** | Tailwind CSS 4 (Turbopack) |
| **База данных** | PostgreSQL |
| **ORM** | Prisma ORM 6 |
| **Авторизация** | NextAuth.js v5 (Credentials Provider) |
| **Карты** | Leaflet + react-leaflet |
| **Календарь** | react-day-picker |
| **Хеширование паролей** | bcryptjs |

---

## Требования

- **Node.js** 20+ (LTS рекомендация)
- **npm** 10+ (или yarn/pnpm)
- **PostgreSQL** 14+ (локальная или удалённая база данных)

---

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd reserving_items
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Скопируйте файл окружения и заполните необходимые значения:

```bash
cp .env.example .env
```

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# Подключение к базе данных PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# Секретный ключ для NextAuth.js (сгенерируйте случайную строку)
AUTH_SECRET="your-super-secret-key-here"

# URL приложения (для локальной разработки)
AUTH_URL="http://localhost:3000"
```

> **Генерация `AUTH_SECRET`:** выполните `openssl rand -hex 32` или используйте любой генератор случайных строк.

### 4. Инициализация базы данных

Примените миграции Prisma для создания таблиц:

```bash
npx prisma migrate deploy
```

Для разработки используйте интерактивную миграцию:

```bash
npx prisma migrate dev
```

Сгенерируйте клиент Prisma:

```bash
npx prisma generate
```

### 5. Запуск dev-сервера

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### 6. Дополнительные команды

```bash
# Запуск Prisma Studio (GUI для БД)
npx prisma studio

# Сборка для продакшена
npm run build

# Запуск продакшен-сервера
npm start

# Линтинг
npm run lint
```

---

## Переменные окружения

| Переменная | Описание | Обязательно |
|---|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL | ✅ |
| `AUTH_SECRET` | Секретный ключ для NextAuth.js | ✅ |
| `AUTH_URL` | URL приложения (для callback URL) | ✅ |

---

## Структура проекта

```
reserving_items/
├── prisma/
│   ├── schema.prisma          # Схема базы данных (модели User, Item, Booking, Review, Message)
│   └── migrations/            # SQL миграции
├── src/
│   ├── lib/
│   │   ├── auth.ts            # Конфигурация NextAuth.js
│   │   └── prisma.ts          # Экземпляр Prisma Client
│   ├── middleware.ts           # Защита маршрутов (dashboard, items/create)
│   ├── actions/               # Серверные действия (Server Actions)
│   │   ├── auth-actions.ts    # Действия регистрации/входа
│   │   ├── booking-actions.ts # Действия работы с бронями
│   │   ├── item-actions.ts    # Действия работы с предметами
│   │   └── review-actions.ts  # Действия работы с отзывами
│   ├── app/
│   │   ├── layout.tsx         # Корневой лейаут (AuthProvider, Navbar, шрифты)
│   │   ├── page.tsx           # Главная страница (лендинг)
│   │   ├── globals.css        # Глобальные стили (Tailwind CSS)
│   │   ├── api/               # API маршруты (Route Handlers)
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth endpoints
│   │   │   ├── bookings/                      # CRUD бронирований
│   │   │   ├── reviews/                      # CRUD отзывов
│   │   │   └── ...
│   │   ├── items/             # Страницы каталога предметов
│   │   │   ├── page.tsx       # Список предметов
│   │   │   ├── [id]/page.tsx  # Детальная страница предмета
│   │   │   └── create/page.ts # Создание нового предмета
│   │   ├── bookings/          # Страницы бронирований
│   │   │   ├── [id]/page.tsx  # Детальная страница брони + чат
│   │   │   ├── my/page.tsx    # Мои бронирования (как арендатор)
│   │   │   └── received/page.ts # Входящие (как владелец)
│   │   ├── dashboard/         # Панель пользователя (защищённая)
│   │   ├── login/             # Страница входа
│   │   └── register/          # Страница регистрации
│   └── components/            # UI компоненты
│       ├── AuthProvider.tsx       # Провайдер аутентификации
│       ├── Navbar.tsx             # Навигационная панель
│       ├── BookingChat.tsx        # Компонент чата для брони
│       ├── BookingTimeline.tsx    # Визуальный таймлайн статусов
│       ├── BookingActions.tsx     # Кнопки действий с бронью
│       ├── BookingCalendar.tsx    # Календарь для выбора дат
│       ├── ItemCard.tsx           # Карточка предмета
│       ├── ItemForm.tsx           # Форма создания/редактирования
│       ├── ItemsMap.tsx           # Карта с предметами
│       ├── ImageGallery.tsx       # Галерея изображений
│       ├── ReviewForm.tsx         # Форма отзыва
│       └── ReviewDisplay.tsx      # Отображение отзывов
├── plans/
│   ├── booking-chat.md          # Техническое описание чата
│   └── booking-lifecycle.md     # Техническое описание жизненного цикла
├── public/                      # Статические файлы
├── .env                         # Переменные окружения (не в git)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwindcss конфигурация
```

---

## Жизненный цикл брони

Подробное описание бизнес-логики бронирований см. в [`plans/booking-lifecycle.md`](plans/booking-lifecycle.md).

### Права доступа по ролям

| Роль | Статус | Доступные действия |
|---|---|---|
| Владелец | `PENDING` | Подтвердить, Отклонить |
| Арендатор | `PENDING` | Отменить |
| Владелец | `CONFIRMED` | Подтвердить получение → `ACTIVE` |
| Арендатор | `CONFIRMED` | Отменить |
| Владелец | `ACTIVE` | Подтвердить возврат → `RETURNED` |
| Владелец | `RETURNED` | Завершить (возврат залога) → `COMPLETED` |

### Залог

- Залог блокируется при переходе в статус `ACTIVE` (`depositHeld = true`)
- Возвращается при завершении (`COMPLETED`, `depositHeld = false`)
- Сумма залога указана в карточке предмета (`Item.depositAmount`)

---

## API маршруты

### Авторизация
- `POST /api/auth/[...nextauth]` — NextAuth endpoints

### Предметы
- `GET /api/items` — список предметов
- `POST /api/items` — создание предмета

### Бронирования
- `GET /api/bookings` — список бронирований
- `POST /api/bookings` — создание бронирования
- `GET /api/bookings/my` — мои бронирования (как арендатор)
- `GET /api/bookings/received` — входящие (как владелец)
- `GET /api/bookings/item/[id]` — бронирования для предмета
- `PATCH /api/bookings/[id]/status` — смена статуса
- `GET /api/bookings/[id]/messages` — получение сообщений чата
- `POST /api/bookings/[id]/messages` — отправка сообщения

### Отзывы
- `GET /api/reviews` — список отзывов
- `POST /api/reviews` — создание отзыва

---

## Модели базы данных

| Модель | Описание |
|---|---|
| **User** | Пользователь (id, email, passwordHash, name, avatarUrl) |
| **Item** | Предмет для аренды (ownerId, title, description, pricePerDay, depositAmount, lat/lng, category, images) |
| **Booking** | Бронирование (itemId, renterId, startDate, endDate, totalAmount, status, depositHeld, timestamps) |
| **Review** | Отзыв (bookingId, authorId, targetId, rating, comment) |
| **Message** | Сообщение в чате (bookingId, senderId, content) |

Полная схема: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## Лицензия

Этот проект находится в активной разработке.
