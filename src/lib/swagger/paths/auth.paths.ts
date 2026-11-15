import { registry } from '../registry';

// Документация NextAuth эндпоинтов
// NextAuth предоставляет собственный callback URL, который документируем вручную

registry.registerPath({
  method: 'get',
  path: '/api/auth/[...nextauth]',
  summary: 'NextAuth callback',
  description: 'NextAuth.js callback endpoint для обработки аутентификации. Используется для OAuth потоков и получения информации о сессии.',
  responses: {
    200: {
      description: 'Успешный ответ NextAuth',
    },
  },
});
