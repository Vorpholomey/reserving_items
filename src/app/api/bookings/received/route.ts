import { NextResponse } from 'next/server';
import prisma, { serializeDecimal } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/bookings/received
 * Входящие брони (для владельца вещи).
 * Требуется аутентификация.
 * Возвращает все бронирования где item.ownerId === current user.
 * Включает данные арендатора (renter).
 * Сортировка по createdAt DESC.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        item: {
          ownerId: session.user.id,
        },
      },
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        item: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(serializeDecimal(bookings));
  } catch (error) {
    console.error('Error fetching received bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
