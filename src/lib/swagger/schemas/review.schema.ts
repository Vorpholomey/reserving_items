import { z } from 'zod';
import { registry } from '../registry';

// Схема отзыва (Review)
export const ReviewSchema = registry.register(
  'Review',
  z.object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'UUID отзыва',
    }),
    bookingId: z.string().uuid().openapi({
      description: 'ID бронирования',
    }),
    authorId: z.string().uuid().openapi({
      description: 'ID автора отзыва',
    }),
    targetId: z.string().uuid().openapi({
      description: 'ID пользователя, о котором оставлен отзыв',
    }),
    rating: z.number().int().min(1).max(5).openapi({
      example: 5,
      description: 'Рейтинг от 1 до 5',
    }),
    comment: z.string().nullable().openapi({
      example: 'Отличный предмет, рекомендую!',
      description: 'Текст отзыва',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Дата создания отзыва',
    }),
  })
);
