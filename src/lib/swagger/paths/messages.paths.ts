import { z } from 'zod';
import { registry } from '../registry';
import { MessageSchema } from '../schemas/message.schema';

// Схема тела для отправки сообщения
const CreateMessageBodySchema = z.object({
  content: z.string().min(1).openapi({
    description: 'Текст сообщения',
    example: 'Здравствуйте! Когда можно забрать предмет?',
  }),
});

// GET /api/bookings/{bookingId}/messages — Получить сообщения чата
registry.registerPath({
  method: 'get',
  path: '/api/bookings/{bookingId}/messages',
  summary: 'Получить сообщения чата',
  description: 'Возвращает список сообщений чата для конкретного бронирования. Доступ только у арендатора и владельца. Требуется аутентификация.',
  tags: ['Messages'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      bookingId: z.string().uuid().openapi({
        description: 'ID бронирования',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Список сообщений',
      content: {
        'application/json': {
          schema: z.array(MessageSchema),
        },
      },
    },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Доступ запрещён' },
    404: { description: 'Бронирование не найдено' },
  },
});

// POST /api/bookings/{bookingId}/messages — Отправить сообщение
registry.registerPath({
  method: 'post',
  path: '/api/bookings/{bookingId}/messages',
  summary: 'Отправить сообщение в чат',
  description: 'Отправляет сообщение в чат бронирования. Доступ только у арендатора и владельца. Требуется аутентификация.',
  tags: ['Messages'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      bookingId: z.string().uuid().openapi({
        description: 'ID бронирования',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: CreateMessageBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Сообщение отправлено',
      content: {
        'application/json': {
          schema: MessageSchema,
        },
      },
    },
    400: { description: 'Ошибка валидации данных' },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Доступ запрещён' },
    404: { description: 'Бронирование не найдено' },
  },
});
