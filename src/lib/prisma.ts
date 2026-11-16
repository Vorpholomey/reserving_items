import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Рекурсивно сериализует объект, преобразуя Decimal в number.
 * Используется для передачи данных из Prisma в Client Components / JSON responses.
 */
export function serializeDecimal(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(serializeDecimal);
  if (typeof obj === 'object') {
    // Прisma Decimal имеет метод toNumber()
    if ('toNumber' in obj && typeof (obj as { toNumber(): number }).toNumber === 'function') {
      return (obj as { toNumber(): number }).toNumber();
    }
    if (obj instanceof Date) return obj.toISOString();
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = serializeDecimal(value);
    }
    return result;
  }
  return obj;
}

export default prisma;
