import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Расширяем Zod с OpenAPI методами (вызывается один раз)
extendZodWithOpenApi(z);

// Создаём регистр для OpenAPI
export const registry = new OpenAPIRegistry();

// Экспортируем z для использования в схемах
export { z };
