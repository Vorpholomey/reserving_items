import { z } from 'zod';
import { registry } from '../registry';
import { ReviewSchema } from '../schemas/review.schema';

// Схема запроса для создания отзыва
const CreateReviewBodySchema = z.object({
  bookingId: z.string().uuid().openapi({
    description: 'ID бронирования',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  rating: z.number().int().min(1).max(5).openapi({
    description: 'Рейтинг от 1 до 5',
    example: 5,
  }),
  comment: z.string().nullable().optional().openapi({
    description: 'Текст отзыва (опционально)',
    example: 'Отличный предмет, рекомендую!',
  }),
});

// GET /api/reviews — Список отзывов
registry.registerPath({
  method: 'get',
  path: '/api/reviews',
  summary: 'Получить список отзывов',
  description: 'Возвращает список отзывов. Поддерживает фильтрацию по userId (отзывы о пользователе).',
  tags: ['Reviews'],
  request: {
    query: z.object({
      userId: z.string().uuid().optional().openapi({
        description: 'ID пользователя для фильтрации отзывов',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Список отзывов',
      content: {
        'application/json': {
          schema: z.array(ReviewSchema),
        },
      },
    },
  },
});

// POST /api/reviews — Создать отзыв
registry.registerPath({
  method: 'post',
  path: '/api/reviews',
  summary: 'Создать отзыв',
  description: `Создаёт отзыв о бронировании.

Требования:
- Бронирование должно быть в статусе COMPLETED
- Пользователь должен быть участником брони (арендатор или владелец)
- Отзыв уникален для пары author + booking
- targetId определяется автоматически:
  - арендатор оставляет отзыв владельцу
  - владелец оставляет отзыв арендатору

Требуется аутентификация.`,
  tags: ['Reviews'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateReviewBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Отзыв создан успешно',
      content: {
        'application/json': {
          schema: ReviewSchema,
        },
      },
    },
    400: { description: 'Ошибка валидации данных' },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Нет прав на создание отзыва' },
    404: { description: 'Бронирование не найдено' },
    409: { description: 'Отзыв уже существует' },
  },
});
