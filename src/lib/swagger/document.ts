import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Импортируем все пути для регистрации (side effects)
import './paths/auth.paths';
import './paths/bookings.paths';
import './paths/messages.paths';
import './paths/status.paths';
import './paths/reviews.paths';

// Импортируем все схемы для регистрации в registry (side effects)
import './schemas/booking.schema';
import './schemas/item.schema';
import './schemas/message.schema';
import './schemas/review.schema';
import './schemas/user.schema';

// Регистрируем security scheme через registry
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Введите JWT токен для аутентификации',
});

/**
 * Генерирует OpenAPI документ для API
 * Документ генерируется при каждом запросе чтобы отражать актуальное состояние registry
 */
export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions, {
    unionPreferredType: 'oneOf',
    sortComponents: 'alphabetically',
  });

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Reserving Items API',
      version: '1.0.0',
      description: 'API документация для платформы аренды вещей. Позволяет создавать бронирования, общаться с владельцами предметов и оставлять отзывы.',
    },
    servers: [
      {
        url: '/',
        description: 'Текущий сервер',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Авторизация и аутентификация пользователей через NextAuth (Credentials provider)',
      },
      {
        name: 'Registration',
        description: 'Регистрация новых пользователей',
      },
      {
        name: 'Items',
        description: 'Управление предметами для аренды (CRUD операции)',
      },
      {
        name: 'Bookings',
        description: 'Создание и управление бронированиями предметов',
      },
      {
        name: 'Bookings/Mine',
        description: 'Личные бронирования текущего пользователя как арендатора',
      },
      {
        name: 'Bookings/Received',
        description: 'Полученные бронирования текущего пользователя как владельца предмета',
      },
      {
        name: 'Messages',
        description: 'Сообщения в чате бронирования между арендатором и владельцем',
      },
      {
        name: 'Reviews',
        description: 'Отзывы о бронированиях и пользователях',
      },
    ],
  });
}