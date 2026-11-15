import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { BookingStatus } from '@prisma/client';

/**
 * Разрешённые переходы статусов по роли.
 *
 * Жизненный цикл:
 *   PENDING → CONFIRMED → ACTIVE → RETURNED → COMPLETED
 *     ↓           ↓           ↓          ↓
 *  CANCELLED   CANCELLED   CANCELLED   (автоматически)
 *
 * Правила:
 *   PENDING → CONFIRMED   — только owner
 *   PENDING → REJECTED    — только owner
 *   PENDING → CANCELLED   — owner или renter
 *   CONFIRMED → ACTIVE    — только renter (подтверждение получения)
 *   CONFIRMED → CANCELLED — owner или renter
 *   ACTIVE → RETURNED     — только owner (подтверждение возврата)
 *   ACTIVE → CANCELLED    — owner или renter
 *   RETURNED → COMPLETED  — автоматически при RETURNED
 *   COMPLETED             — терминальный
 *   CANCELLED             — терминальный
 *   REJECTED              — терминальный
 */
const STATUS_TRANSITIONS: Record<
  string,
  { owner: BookingStatus[]; renter: BookingStatus[] }
> = {
  PENDING: {
    owner: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
    renter: ['CANCELLED'],
  },
  CONFIRMED: {
    owner: ['CANCELLED'],
    renter: ['ACTIVE', 'CANCELLED'],
  },
  ACTIVE: {
    owner: ['RETURNED', 'CANCELLED'],
    renter: ['CANCELLED'],
  },
  RETURNED: {
    // COMPLETED происходит автоматически, вручную не инициируется
    owner: [],
    renter: [],
  },
  COMPLETED: {
    owner: [],
    renter: [],
  },
  CANCELLED: {
    owner: [],
    renter: [],
  },
  REJECTED: {
    owner: [],
    renter: [],
  },
};

/**
 * Собирает данные для update в зависимости от перехода.
 */
function getTransitionData(currentStatus: string, newStatus: BookingStatus) {
  const data: Record<string, string | Date | boolean> = { status: newStatus };

  switch (`${currentStatus}->${newStatus}`) {
    case 'PENDING->CONFIRMED':
      data.confirmedAt = new Date();
      break;
    case 'CONFIRMED->ACTIVE':
      data.receivedAt = new Date();
      break;
    case 'ACTIVE->RETURNED':
      data.returnedAt = new Date();
      break;
    case 'RETURNED->COMPLETED':
      data.completedAt = new Date();
      data.depositHeld = false;
      break;
    default:
      if (newStatus === 'CANCELLED') {
        data.cancelledAt = new Date();
      }
      break;
  }

  return data;
}

/**
 * PATCH /api/bookings/[id]/status
 * Смена статуса бронирования с проверкой жизненного цикла.
 * Требуется аутентификация.
 * Body: { status }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: bookingId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    const validStatuses: BookingStatus[] = [
      'PENDING',
      'CONFIRMED',
      'ACTIVE',
      'RETURNED',
      'COMPLETED',
      'CANCELLED',
      'REJECTED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Получаем бронирование с Item
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        item: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const currentStatus = booking.status;
    const transitions = STATUS_TRANSITIONS[currentStatus];

    if (!transitions) {
      return NextResponse.json(
        { error: `No transitions available from status ${currentStatus}` },
        { status: 400 }
      );
    }

    // Проверяем роль: владелец вещи или арендатор
    const isOwner = booking.item.ownerId === userId;
    const isRenter = booking.renterId === userId;

    if (isOwner) {
      if (!transitions.owner.includes(status as BookingStatus)) {
        return NextResponse.json(
          {
            error: `Invalid transition from ${currentStatus} to ${status} for owner`,
            allowed: transitions.owner,
          },
          { status: 400 }
        );
      }
    } else if (isRenter) {
      if (!transitions.renter.includes(status as BookingStatus)) {
        return NextResponse.json(
          {
            error: `Invalid transition from ${currentStatus} to ${status} for renter`,
            allowed: transitions.renter,
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'You do not have permission to update this booking' },
        { status: 403 }
      );
    }

    // Используем транзакцию для атомарности переходов
    let result;
    if (currentStatus === 'ACTIVE' && status === 'RETURNED') {
      // ACTIVE → RETURNED → COMPLETED (автоматически)
      result = await prisma.$transaction(async (tx) => {
        // Шаг 1: ACTIVE → RETURNED
        const returnedData = getTransitionData(currentStatus, 'RETURNED');
        await tx.booking.update({
          where: { id: bookingId },
          data: returnedData,
        });

        // Шаг 2: RETURNED → COMPLETED (автоматически)
        const completedData = getTransitionData('RETURNED', 'COMPLETED');
        return tx.booking.update({
          where: { id: bookingId },
          data: completedData,
          include: {
            item: true,
            renter: true,
          },
        });
      });
    } else {
      const updateData = getTransitionData(currentStatus, status as BookingStatus);
      result = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          item: true,
          renter: true,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
