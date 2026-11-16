import { NextResponse } from 'next/server';
import prisma, { serializeDecimal } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/bookings/[id]/messages
 * Получение сообщений чата для брони.
 * Требуется аутентификация. Доступ только у renter и owner вещи.
 */
export async function GET(
  _request: Request,
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

    // Проверяем доступ: owner вещи или renter брони
    const isOwner = booking.item.ownerId === userId;
    const isRenter = booking.renterId === userId;

    if (!isOwner && !isRenter) {
      return NextResponse.json(
        { error: 'You do not have access to this chat' },
        { status: 403 }
      );
    }

    // Получаем сообщения с данными отправителя
    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(serializeDecimal(messages));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/[id]/messages
 * Отправка сообщения в чат брони.
 * Требуется аутентификация. Доступ только у renter и owner вещи.
 * Body: { content }
 */
export async function POST(
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
    const { content } = body;

    // Валидация content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must not exceed 2000 characters' },
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

    // Проверяем доступ: owner вещи или renter брони
    const isOwner = booking.item.ownerId === userId;
    const isRenter = booking.renterId === userId;

    if (!isOwner && !isRenter) {
      return NextResponse.json(
        { error: 'You do not have access to this chat' },
        { status: 403 }
      );
    }

    // Создаём сообщение
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(serializeDecimal(message), { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
