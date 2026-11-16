import { z } from 'zod';
import { registry } from '../registry';
import { UserResponseSchema } from '../schemas/user.schema';

// Схема тела для регистрации
const RegisterBodySchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
  }),
  email: z.string().email().openapi({
    description: 'Email пользователя',
    example: 'user@example.com',
  }),
  password: z.string().min(6).openapi({
    description: 'Пароль (минимум 6 символов)',
    example: 'securepassword123',
  }),
});

// Схема тела для входа
const LoginBodySchema = z.object({
  email: z.string().email().openapi({
    description: 'Email пользователя',
    example: 'user@example.com',
  }),
  password: z.string().openapi({
    description: 'Пароль пользователя',
    example: 'securepassword123',
  }),
});

// Схема сессии
const SessionSchema = registry.register(
  'Session',
  z.object({
    user: z.object({
      id: z.string().uuid().openapi({
        description: 'ID пользователя',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
      name: z.string().nullable().optional().openapi({
        description: 'Имя пользователя',
        example: 'Иван Иванов',
      }),
      email: z.string().email().optional().openapi({
        description: 'Email пользователя',
        example: 'user@example.com',
      }),
    }).openapi({
      description: 'Информация о пользователе сессии',
    }),
    expires: z.string().datetime().openapi({
      description: 'Срок действия сессии (ISO 8601)',
      example: '2026-12-16T07:00:00.000Z',
    }),
  })
);

// Схема ошибки авторизации
const AuthErrorSchema = registry.register(
  'AuthError',
  z.object({
    error: z.string().openapi({
      description: 'Сообщение об ошибке',
      example: 'Invalid credentials',
    }),
  })
);

// POST /api/auth/register - Регистрация нового пользователя
registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Зарегистрировать нового пользователя',
  description: `Создаёт нового пользователя в системе и автоматически вход.

Процесс:
- Проверяет уникальность email
- Хеширует пароль с bcrypt (cost = 12)
- Создаёт пользователя в базе данных
- Автоматически авторизует через NextAuth Credentials provider`,
  tags: ['Registration'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Пользователь успешно зарегистрирован и авторизован',
      content: {
        'application/json': {
          schema: UserResponseSchema,
        },
      },
    },
    400: {
      description: 'Ошибка валидации данных или пользователь с таким email уже существует',
      content: {
        'application/json': {
          schema: AuthErrorSchema,
        },
      },
    },
    500: {
      description: 'Внутренняя ошибка сервера',
      content: {
        'application/json': {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// POST /api/auth/callback/credentials - Вход по email/password (NextAuth)
registry.registerPath({
  method: 'post',
  path: '/api/auth/callback/credentials',
  summary: 'Войти в систему по email и паролю',
  description: `Авторизация через NextAuth Credentials provider.

Процесс:
- Проверяет email и пароль
- Сравнивает пароль с хешем в базе (bcrypt)
- Создаёт JWT токен сессии
- Устанавливает cookie сессии`,
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginBodySchema,
        },
      },
    },
  },
  responses: {
    302: {
      description: 'Успешный вход (редирект на callbackUrl)',
    },
    401: {
      description: 'Неверный email или пароль',
      content: {
        'application/json': {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// GET /api/auth/session - Получить текущую сессию
registry.registerPath({
  method: 'get',
  path: '/api/auth/session',
  summary: 'Получить текущую сессию пользователя',
  description: 'Возвращает информацию о текущей авторизованной сессии включая данные пользователя. Если пользователь не авторизован, возвращает null.',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Информация о сессии (null если не авторизован)',
      content: {
        'application/json': {
          schema: z.union([SessionSchema, z.null()]),
        },
      },
    },
  },
});

// POST /api/auth/signout - Выйти из системы
registry.registerPath({
  method: 'post',
  path: '/api/auth/signout',
  summary: 'Выйти из системы',
  description: 'Завершает текущую сессию пользователя, удаляет cookie сессии и редиректит на страницу входа.',
  tags: ['Auth'],
  responses: {
    302: {
      description: 'Успешный выход (редирект на страницу входа)',
    },
  },
});

// GET /api/auth/[...nextauth] - NextAuth callback (OAuth и другие провайдеры)
registry.registerPath({
  method: 'get',
  path: '/api/auth/[...nextauth]',
  summary: 'NextAuth callback',
  description: `Универсальный endpoint NextAuth.js для обработки аутентификации.

Поддерживаемые операции:
- GET /api/auth/signin — страница входа
- GET /api/auth/signout — выход
- GET /api/auth/session — данные сессии
- GET /api/auth/csrf — CSRF токен
- GET /api/auth/providers — список провайдеров
- GET /api/auth/callback/* — OAuth callback
- GET /api/auth/error — страница ошибок`,
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Успешный ответ NextAuth',
    },
    302: {
      description: 'Редирект (для signin/signout/error)',
    },
  },
});

// POST /api/auth/[...nextauth] — NextAuth callback (POST запросы)
registry.registerPath({
  method: 'post',
  path: '/api/auth/[...nextauth]',
  summary: 'NextAuth callback (POST)',
  description: `Обработка POST запросов NextAuth.js.

Поддерживаемые операции:
- POST /api/auth/signin — вход через провайдер
- POST /api/auth/signout — выход из системы
- POST /api/auth/csrf — получение CSRF токена
- POST /api/auth/callback/* — OAuth callback (POST)`,
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Успешный ответ NextAuth',
    },
    302: {
      description: 'Редирект после обработки',
    },
  },
});

// GET /api/auth/signin — страница входа
registry.registerPath({
  method: 'get',
  path: '/api/auth/signin',
  summary: 'Страница входа',
  description: 'Возвращает HTML страницу входа или редирект на страницу входа (/login).',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'HTML страница входа',
    },
    302: {
      description: 'Редирект на кастомную страницу входа',
    },
  },
});

// GET /api/auth/csrf — получить CSRF токен
registry.registerPath({
  method: 'get',
  path: '/api/auth/csrf',
  summary: 'Получить CSRF токен',
  description: 'Возвращает CSRF токен, необходимый для безопасных запросов к API авторизации.',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'CSRF токен',
      content: {
        'application/json': {
          schema: z.object({
            csrfToken: z.string().openapi({
              description: 'CSRF токен',
              example: 'abc123...',
            }),
          }),
        },
      },
    },
  },
});

// GET /api/auth/providers — список провайдеров
registry.registerPath({
  method: 'get',
  path: '/api/auth/providers',
  summary: 'Получить список провайдеров авторизации',
  description: 'Возвращает список доступных провайдеров авторизации (Credentials, OAuth и т.д.).',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Список провайдеров',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string().openapi({
                description: 'ID провайдера',
                example: 'credentials',
              }),
              name: z.string().openapi({
                description: 'Название провайдера',
                example: 'Credentials',
              }),
              type: z.string().openapi({
                description: 'Тип провайдера',
                example: 'credentials',
              }),
            })
          ),
        },
      },
    },
  },
});
