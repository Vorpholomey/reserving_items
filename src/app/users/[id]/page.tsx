import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ReviewDisplay from "@/components/ReviewDisplay";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  // Загрузка пользователя
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      items: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Пользователь не найден
          </h1>
          <Link
            href="/items"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  // Загрузка отзывов о пользователе
  const reviews = await prisma.review.findMany({
    where: { targetId: id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
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

  const avgResult = await prisma.review.aggregate({
    where: { targetId: id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = avgResult._avg.rating ?? 0;
  const reviewCount = avgResult._count.rating;

  // Загрузка вещей пользователя
  const items = user.items;

  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    author: r.author,
    booking: r.booking
      ? {
          id: r.booking.id,
          item: r.booking.item
            ? { id: r.booking.item.id, title: r.booking.item.title }
            : undefined,
        }
      : undefined,
  }));

  const joinedDate = new Date(user.createdAt);
  const formattedDate = joinedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Навигационная ссылка */}
      <div className="mb-6">
        <Link
          href="/items"
          className="inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к каталогу
        </Link>
      </div>

      {/* Профиль пользователя */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          {/* Информация */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white">
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.name || "Без имени"}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">
                На платформе с {formattedDate}
              </p>
            </div>
          </div>

          {/* Рейтинг */}
          {reviewCount > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-amber-700">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="h-5 w-5"
                      fill={
                        star <= Math.round(averageRating) ? "#F59E0B" : "#D1D5DB"
                      }
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{reviewCount}</span> отзыв
                {getReviewWord(reviewCount)}
              </div>
            </div>
          )}

          {/* Статистика */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {items.length}
              </p>
              <p className="text-sm text-gray-500">
                вещь{getItemWord(items.length)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {reviewCount}
              </p>
              <p className="text-sm text-gray-500">
                отзыв{getReviewWord(reviewCount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Вещи пользователя */}
      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Вещи пользователя
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="mt-1 text-xs text-gray-400">ID: {item.id.slice(0, 8)}…</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Все отзывы */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Все отзывы
        </h2>
        <ReviewDisplay
          reviews={serializedReviews}
          averageRating={averageRating}
          reviewCount={reviewCount}
        />
      </div>
    </div>
  );
}

function getReviewWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return "ов";
  if (lastOne === 1) return "";
  if (lastOne >= 2 && lastOne <= 4) return "а";
  return "ов";
}

function getItemWord(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return "ей";
  if (lastOne === 1) return "";
  if (lastOne >= 2 && lastOne <= 4) return "и";
  return "ей";
}
