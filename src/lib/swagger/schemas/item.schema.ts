import { z } from 'zod';
import { registry } from '../registry';

// Схема предмета (Item)
export const ItemSchema = registry.register(
  'Item',
  z.object({
    id: z.string().uuid().openapi({
      example: '123e4567-e89b-12d3-a456-426614174000',
      description: 'UUID предмета',
    }),
    ownerId: z.string().uuid().openapi({
      description: 'ID владельца предмета',
    }),
    title: z.string().openapi({
      example: 'Фотоаппарат Canon EOS R5',
      description: 'Название предмета',
    }),
    description: z.string().openapi({
      example: 'Профессиональный беззеркальный фотоаппарат...',
      description: 'Описание предмета',
    }),
    pricePerDay: z.string().openapi({
      example: '1500.00',
      description: 'Цена за день аренды',
    }),
    depositAmount: z.string().openapi({
      example: '5000.00',
      description: 'Сумма залога',
    }),
    latitude: z.number().nullable().openapi({
      example: 55.7558,
      description: 'Широта местоположения',
    }),
    longitude: z.number().nullable().openapi({
      example: 37.6173,
      description: 'Долгота местоположения',
    }),
    category: z.string().openapi({
      example: 'Электроника',
      description: 'Категория предмета',
    }),
    images: z.array(z.string().url()).openapi({
      example: ['https://example.com/image1.jpg'],
      description: 'Массив URL изображений',
    }),
    isActive: z.boolean().openapi({
      example: true,
      description: 'Активен ли предмет',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Дата создания',
    }),
  })
);
