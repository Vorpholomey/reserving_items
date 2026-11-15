import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/bookings/item/[id]
 * Возвращает занятые диапазоны дат для календаря.
 * Не требует аутентификации.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const bookings = await prisma.booking.findMany({
      where: {
        itemId,
        status: {
          in: ['CONFIRMED', 'ACTIVE'],
        },
      },
      select: {
        startDate: true,
        endDate: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    const ranges = bookings.map((b) => ({
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
    }));

    return NextResponse.json(ranges);
  } catch (error) {
    console.error('Error fetching item bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
