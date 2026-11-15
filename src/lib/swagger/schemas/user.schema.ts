import { z } from 'zod';
import { registry } from '../registry';

// Схема пользователя
export const UserSchema = registry.register(
  'User',
  z.object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'UUID пользователя',
    }),
    email: z.string().email().openapi({
      example: 'user@example.com',
      description: 'Email пользователя',
    }),
    name: z.string().nullable().openapi({
      example: 'Иван Иванов',
      description: 'Имя пользователя',
    }),
    avatarUrl: z.string().url().nullable().openapi({
      example: 'https://example.com/avatar.jpg',
      description: 'URL аватара пользователя',
    }),
    isVerified: z.boolean().openapi({
      example: true,
      description: 'Подтверждён ли email',
    }),
    emailVerified: z.string().datetime().nullable().openapi({
      description: 'Дата подтверждения email',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Дата регистрации',
    }),
  })
);

// Схема пользователя для ответа (без чувствительных данных)
export const UserResponseSchema = registry.register(
  'UserResponse',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    isVerified: z.boolean(),
    createdAt: z.string().datetime(),
  })
);
