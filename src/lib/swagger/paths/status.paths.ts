import { z } from 'zod';
import { registry } from '../registry';
import { BookingSchema, BookingStatusEnum } from '../schemas/booking.schema';

// Схема тела для смены статуса
const UpdateStatusBodySchema = z.object({
  status: BookingStatusEnum.openapi({
    description: 'Новый статус бронирования',
    example: 'CONFIRMED',
  }),
});

// PATCH /api/bookings/{bookingId}/status — Сменить статус бронирования
registry.registerPath({
  method: 'patch',
  path: '/api/bookings/{bookingId}/status',
  summary: 'Сменить статус бронирования',
  description: `Изменяет статус бронирования согласно правилам жизненного цикла:

- PENDING → CONFIRMED — только владелец
- PENDING → REJECTED — только владелец  
- PENDING → CANCELLED — владелец или арендатор
- CONFIRMED → ACTIVE — только арендатор
- CONFIRMED → CANCELLED — владелец или арендатор
- ACTIVE → RETURNED — только владелец
- ACTIVE → CANCELLED — владелец или арендатор

Требуется аутентификация.`,
  tags: ['Bookings'],
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
          schema: UpdateStatusBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Статус изменён успешно',
      content: {
        'application/json': {
          schema: BookingSchema,
        },
      },
    },
    400: { description: 'Недопустимый переход статуса' },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Доступ запрещён (нет прав на смену статуса)' },
    404: { description: 'Бронирование не найдено' },
  },
});
