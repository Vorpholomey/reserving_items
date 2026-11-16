import { z } from 'zod';
import { registry } from '../registry';
import { ItemSchema } from '../schemas/item.schema';

// Схема тела для создания предмета
const CreateItemBodySchema = z.object({
  title: z.string().min(1).openapi({
    description: 'Название предмета',
    example: 'Фотоаппарат Canon EOS R5',
  }),
  description: z.string().min(1).openapi({
    description: 'Описание предмета',
    example: 'Профессиональный беззеркальный фотоаппарат...',
  }),
  pricePerDay: z.number().positive().openapi({
    description: 'Цена за день аренды',
    example: 1500,
  }),
  depositAmount: z.number().min(0).openapi({
    description: 'Сумма залога',
    example: 5000,
  }),
  category: z.string().min(1).openapi({
    description: 'Категория предмета',
    example: 'Электроника',
  }),
  images: z.array(z.string().url()).openapi({
    description: 'Массив URL изображений',
    example: ['https://example.com/image1.jpg'],
  }),
  latitude: z.number().optional().openapi({
    description: 'Широта местоположения',
    example: 55.7558,
  }),
  longitude: z.number().optional().openapi({
    description: 'Долгота местоположения',
    example: 37.6173,
  }),
});

// Схема тела для обновления предмета
const UpdateItemBodySchema = z.object({
  title: z.string().min(1).optional().openapi({
    description: 'Название предмета',
    example: 'Фотоаппарат Canon EOS R6',
  }),
  description: z.string().min(1).optional().openapi({
    description: 'Описание предмета',
    example: 'Обновлённое описание предмета...',
  }),
  pricePerDay: z.number().positive().optional().openapi({
    description: 'Цена за день аренды',
    example: 1800,
  }),
  depositAmount: z.number().min(0).optional().openapi({
    description: 'Сумма залога',
    example: 6000,
  }),
  category: z.string().min(1).optional().openapi({
    description: 'Категория предмета',
    example: 'Фотография',
  }),
  images: z.array(z.string().url()).optional().openapi({
    description: 'Массив URL изображений',
    example: ['https://example.com/image2.jpg'],
  }),
  latitude: z.number().optional().openapi({
    description: 'Широта местоположения',
    example: 55.7522,
  }),
  longitude: z.number().optional().openapi({
    description: 'Долгота местоположения',
    example: 37.6156,
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Активен ли предмет',
    example: true,
  }),
});

// GET /api/items — Получить все активные предметы (каталог)
registry.registerPath({
  method: 'get',
  path: '/api/items',
  summary: 'Получить все активные предметы',
  description: 'Возвращает список всех активных предметов в каталоге с информацией о владельцах.',
  tags: ['Items'],
  responses: {
    200: {
      description: 'Список предметов',
      content: {
        'application/json': {
          schema: z.array(ItemSchema),
        },
      },
    },
  },
});

// GET /api/items/{id} — Получить предмет по ID
registry.registerPath({
  method: 'get',
  path: '/api/items/{id}',
  summary: 'Получить предмет по ID',
  description: 'Возвращает детальную информацию о конкретном предмете с данными владельца.',
  tags: ['Items'],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'ID предмета',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Информация о предмете',
      content: {
        'application/json': {
          schema: ItemSchema,
        },
      },
    },
    404: { description: 'Предмет не найден' },
  },
});

// POST /api/items — Создать новый предмет
registry.registerPath({
  method: 'post',
  path: '/api/items',
  summary: 'Создать новый предмет',
  description: 'Создаёт новый предмет в каталоге. Требуется аутентификация.',
  tags: ['Items'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateItemBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Предмет создан успешно',
      content: {
        'application/json': {
          schema: ItemSchema,
        },
      },
    },
    400: { description: 'Ошибка валидации данных' },
    401: { description: 'Требуется аутентификация' },
  },
});

// PUT /api/items/{id} — Обновить предмет
registry.registerPath({
  method: 'put',
  path: '/api/items/{id}',
  summary: 'Обновить предмет',
  description: 'Обновляет информацию о предмете. Только владелец может редактировать свой предмет. Требуется аутентификация.',
  tags: ['Items'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'ID предмета',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateItemBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Предмет обновлён успешно',
      content: {
        'application/json': {
          schema: ItemSchema,
        },
      },
    },
    400: { description: 'Ошибка валидации данных' },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Нет прав для редактирования этого предмета' },
    404: { description: 'Предмет не найден' },
  },
});

// DELETE /api/items/{id} — Удалить предмет
registry.registerPath({
  method: 'delete',
  path: '/api/items/{id}',
  summary: 'Удалить предмет',
  description: 'Удаляет предмет из каталога. Только владелец может удалить свой предмет. Требуется аутентификация.',
  tags: ['Items'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'ID предмета',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Предмет удалён успешно',
    },
    401: { description: 'Требуется аутентификация' },
    403: { description: 'Нет прав для удаления этого предмета' },
    404: { description: 'Предмет не найден' },
  },
});
