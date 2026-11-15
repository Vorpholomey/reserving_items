import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/reviews
 * Создать отзыв о бронировании.
 *
 * Требования:
 * - Бронирование должно быть в статусе COMPLETED
 * - Пользователь должен быть участником брони (renter или owner)
 * - Отзыв уникален для пары author + booking
 * - targetId определяется автоматически:
 *   - renter оставляет отзыв owner'у
 *   - owner оставляет отзыв renter'у
 *
 * Body: { bookingId, rating, comment? }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authorId = session.user.id;
    const body = await request.json();
    const { bookingId, rating, comment } = body;

    // Валидация
    if (!bookingId || rating == null) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId, rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Получаем бронирование с данными
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        item: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Проверка статуса
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Reviews can only be submitted for completed bookings" },
        { status: 400 }
      );
    }

    // Проверка участия в брони
    const isRenter = booking.renterId === authorId;
    const isOwner = booking.item.ownerId === authorId;

    if (!isRenter && !isOwner) {
      return NextResponse.json(
        { error: "Only booking participants can submit reviews" },
        { status: 403 }
      );
    }

    // Определяем targetId
    const targetId = isRenter ? booking.item.ownerId : booking.renterId;

    // Проверка уникальности (author + booking)
    const existingReview = await prisma.review.findUnique({
      where: {
        authorId_bookingId: {
          authorId,
          bookingId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this booking" },
        { status: 409 }
      );
    }

    // Создаём отзыв
    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId,
        targetId,
        rating,
        comment: comment || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            item: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?userId=xxx
 * Получить все отзывы о пользователе.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const bookingId = searchParams.get("bookingId");

    if (userId) {
      // Отзывы о конкретном пользователе
      const reviews = await prisma.review.findMany({
        where: { targetId: userId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          booking: {
            select: {
              id: true,
              item: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Средний рейтинг
      const avgResult = await prisma.review.aggregate({
        where: { targetId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return NextResponse.json({
        reviews,
        averageRating: avgResult._avg.rating ?? 0,
        reviewCount: avgResult._count.rating,
      });
    }

    if (bookingId) {
      // Отзывы по конкретному бронированию
      const reviews = await prisma.review.findMany({
        where: { bookingId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          target: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(reviews);
    }

    return NextResponse.json(
      { error: "Provide userId or bookingId query parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
