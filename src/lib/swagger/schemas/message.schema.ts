import { z } from 'zod';
import { registry } from '../registry';

// Схема сообщения (Message)
export const MessageSchema = registry.register(
  'Message',
  z.object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'UUID сообщения',
    }),
    bookingId: z.string().uuid().openapi({
      description: 'ID бронирования',
    }),
    senderId: z.string().uuid().openapi({
      description: 'ID отправителя',
    }),
    content: z.string().openapi({
      example: 'Здравствуйте! Когда можно забрать предмет?',
      description: 'Текст сообщения',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Дата отправки',
    }),
  })
);
