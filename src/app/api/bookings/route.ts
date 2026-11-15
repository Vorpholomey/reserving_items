
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/bookings
 * Создание бронирования.
 * Требуется аутентификация.
 * Body: { itemId, startDate, endDate }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { itemId, startDate, endDate } = body;

    // Валидация входных данных
    if (!itemId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, startDate, endDate' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Используем интерактивную транзакцию с блокировкой
    const result = await prisma.$transaction(async (tx) => {
      // Получаем Item с блокировкой
      const item = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT "id" FROM "items" WHERE "id" = ${itemId} FOR UPDATE`
      );

      if (item.length === 0) {
        throw new Error('Item not found');
      }

      // Получаем полные данные Item
      const fullItem = await tx.item.findUnique({
        where: { id: itemId },
      });

      if (!fullItem || !fullItem.isActive) {
        throw new Error('Item not found or inactive');
      }

      // Проверка: пользователь не может забронировать свою вещь
      if (fullItem.ownerId === userId) {
        throw new Error('FORBIDDEN');
      }

      // Проверка пересечения с существующими бронированиями
      // Даты пересекаются если: startDate1 < endDate2 AND endDate1 > startDate2
      const overlappingBookings = await tx.booking.findMany({
        where: {
          itemId,
          status: {
            in: ['CONFIRMED', 'ACTIVE'],
          },
          OR: [
            {
              startDate: {
                lt: end,
              },
              endDate: {
                gt: start,
              },
            },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        throw new Error('CONFLICT');
      }

      // Рассчитываем totalAmount: дни * pricePerDay + depositAmount + 10% комиссия
      // Одинаковая формула с клиентом: даже бронь на одни сутки = 1 день
      const days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const rentalCost = Number(fullItem.pricePerDay) * days;
      const deposit = Number(fullItem.depositAmount);
      const subtotal = rentalCost + deposit;
      const totalAmount = subtotal + subtotal * 0.1;

      // Создаём бронирование
      const booking = await tx.booking.create({
        data: {
          itemId,
          renterId: userId,
          startDate: start,
          endDate: end,
          totalAmount,
          status: 'PENDING',
        },
        include: {
          item: true,
          renter: true,
        },
      });

      return booking;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'You cannot book your own item' },
        { status: 403 }
      );
    }

    if (message === 'CONFLICT') {
      return NextResponse.json(
        { error: 'This item is already booked for the selected dates' },
        { status: 409 }
      );
    }

    if (message === 'Item not found' || message === 'Item not found or inactive') {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
