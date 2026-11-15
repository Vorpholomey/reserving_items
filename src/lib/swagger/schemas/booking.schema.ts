import { z } from 'zod';
import { registry } from '../registry';

// Перечисление статусов бронирования
export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'RETURNED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
]).openapi({
  description: 'Статус бронирования',
  example: 'PENDING',
});

// Схема бронирования (Booking)
export const BookingSchema = registry.register(
  'Booking',
  z.object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'UUID бронирования',
    }),
    itemId: z.string().uuid().openapi({
      description: 'ID предмета',
    }),
    renterId: z.string().uuid().openapi({
      description: 'ID арендатора',
    }),
    startDate: z.string().datetime().openapi({
      description: 'Дата начала аренды',
    }),
    endDate: z.string().datetime().openapi({
      description: 'Дата окончания аренды',
    }),
    totalAmount: z.string().openapi({
      example: '4500.00',
      description: 'Общая сумма бронирования',
    }),
    status: BookingStatusEnum,
    depositHeld: z.boolean().openapi({
      description: 'Удержан ли залог',
    }),
    confirmedAt: z.string().datetime().nullable().openapi({
      description: 'Дата подтверждения',
    }),
    receivedAt: z.string().datetime().nullable().openapi({
      description: 'Дата получения предмета',
    }),
    returnedAt: z.string().datetime().nullable().openapi({
      description: 'Дата возврата предмета',
    }),
    completedAt: z.string().datetime().nullable().openapi({
      description: 'Дата завершения',
    }),
    cancelledAt: z.string().datetime().nullable().openapi({
      description: 'Дата отмены',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Дата создания',
    }),
    updatedAt: z.string().datetime().openapi({
      description: 'Дата обновления',
    }),
  })
);
