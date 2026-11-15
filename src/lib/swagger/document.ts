import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Импортируем все пути для регистрации (side effects)
import './paths/auth.paths';
import './paths/bookings.paths';
import './paths/messages.paths';
import './paths/status.paths';
import './paths/reviews.paths';

// Регистрируем security scheme через registry
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Введите JWT токен для аутентификации',
});

// Кэшируем документ для повторного использования
let cachedDocument: unknown | null = null;

/**
 * Генерирует OpenAPI документ для API
 */
export function generateOpenAPIDocument() {
  if (cachedDocument) {
    return cachedDocument as object;
  }

  const generator = new OpenApiGeneratorV31(registry.definitions, {
    unionPreferredType: 'oneOf',
    sortComponents: 'alphabetically',
  });

  cachedDocument = generator.generateDocument({
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
  });

  return cachedDocument as object;
}
