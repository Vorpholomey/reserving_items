import { z } from 'zod';
import { registry } from '../registry';
import { BookingSchema } from '../schemas/booking.schema';

// Схема запроса для создания бронирования
const CreateBookingBodySchema = z.object({
  itemId: z.string().uuid().openapi({
    description: 'ID предмета для бронирования',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  startDate: z.string().datetime().openapi({
    description: 'Дата начала бронирования (ISO 8601)',
    example: '2026-12-01T00:00:00.000Z',
  }),
  endDate: z.string().datetime().openapi({
    description: 'Дата окончания бронирования (ISO 8601)',
    example: '2026-12-07T00:00:00.000Z',
  }),
});

// Схема ID бронирования в пути
const BookingIdParamSchema = registry.registerParameter(
  'BookingId',
  z.string().uuid().openapi({
    description: 'ID бронирования',
    example: '123e4567-e89b-12d3-a456-426614174000',
    param: {
      name: 'bookingId',
      in: 'path',
    },
  })
);

// GET /api/bookings - Список бронирований
registry.registerPath({
  method: 'get',
  path: '/api/bookings',
  summary: 'Получить список бронирований',
  description: 'Возвращает список всех бронирований. Требуется аутентификация.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Список бронирований',
      content: {
        'application/json': {
          schema: z.array(BookingSchema),
        },
      },
    },
    401: { description: 'Требуется аутентификация' },
  },
});

// POST /api/bookings - Создание бронирования
registry.registerPath({
  method: 'post',
  path: '/api/bookings',
  summary: 'Создать бронирование',
  description: 'Создаёт новое бронирование предмета. Требуется аутентификация.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBookingBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Бронирование создано успешно',
      content: {
        'application/json': {
          schema: BookingSchema,
        },
      },
    },
    400: { description: 'Ошибка валидации данных' },
    401: { description: 'Требуется аутентификация' },
    404: { description: 'Предмет не найден' },
    409: { description: 'Период уже забронирован' },
  },
});

// GET /api/bookings/my - Мои бронирования
registry.registerPath({
  method: 'get',
  path: '/api/bookings/my',
  summary: 'Получить мои бронирования',
  description: 'Возвращает список бронирований текущего пользователя как арендатора. Требуется аутентификация.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Список моих бронирований',
      content: {
        'application/json': {
          schema: z.array(BookingSchema),
        },
      },
    },
    401: { description: 'Требуется аутентификация' },
  },
});

// GET /api/bookings/received - Полученные бронирования
registry.registerPath({
  method: 'get',
  path: '/api/bookings/received',
  summary: 'Получить полученные бронирования',
  description: 'Возвращает список бронирований текущего пользователя как владельца предмета. Требуется аутентификация.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Список полученных бронирований',
      content: {
        'application/json': {
          schema: z.array(BookingSchema),
        },
      },
    },
    401: { description: 'Требуется аутентификация' },
  },
});

// GET /api/bookings/item/{itemId} - Бронирования по предмету
registry.registerPath({
  method: 'get',
  path: '/api/bookings/item/{itemId}',
  summary: 'Получить бронирования по предмету',
  description: 'Возвращает список бронирований для конкретного предмета.',
  request: {
    params: z.object({
      itemId: z.string().uuid().openapi({
        description: 'ID предмета',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Список бронирований предмета',
      content: {
        'application/json': {
          schema: z.array(BookingSchema),
        },
      },
    },
    404: { description: 'Предмет не найден' },
  },
});
