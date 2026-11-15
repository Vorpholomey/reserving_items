import Link from "next/link";
import ImageGallery from "@/components/ImageGallery";
import MiniMap from "@/components/MiniMap";
import BookingCalendar from "@/components/BookingCalendar";
import { getItemById } from "@/actions/item-actions";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ReviewDisplay from "@/components/ReviewDisplay";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SerializedItem {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  latitude: number | null;
  longitude: number | null;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  let item: SerializedItem | null = null;
  let error: Error | null = null;
  let ownerReviews: {
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      author: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl?: string | null;
      };
      booking?: {
        id: string;
        item?: { id: string; title: string };
      };
    }>;
    averageRating: number;
    reviewCount: number;
  } | null = null;

  try {
    const raw = await getItemById(id);
    item = {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      pricePerDay:
        typeof raw.pricePerDay === "number"
          ? raw.pricePerDay
          : (raw.pricePerDay as { toNumber(): number }).toNumber(),
      depositAmount:
        typeof raw.depositAmount === "number"
          ? raw.depositAmount
          : (raw.depositAmount as { toNumber(): number }).toNumber(),
      latitude: (raw as { latitude?: number | null }).latitude ?? null,
      longitude: (raw as { longitude?: number | null }).longitude ?? null,
      category: raw.category,
      images: raw.images,
      isActive: raw.isActive,
      createdAt: raw.createdAt.toISOString(),
      owner: raw.owner,
    };

    // Загрузка отзывов владельца
    const reviewsData = await prisma.review.findMany({
      where: { targetId: raw.owner.id },
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
      where: { targetId: raw.owner.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    ownerReviews = {
      reviews: reviewsData.map((r) => ({
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
      })),
      averageRating: avgResult._avg.rating ?? 0,
      reviewCount: avgResult._count.rating,
    };
  } catch (e) {
    error = e as Error;
  }

  // Не найдена
  if (!item && error) {
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Вещь не найдена
          </h1>
          <p className="mt-2 text-gray-600">
            Возможно, она была удалена или вы ввели неверную ссылку.
          </p>
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

  if (!item) {
    return null;
  }

  const createdAt = new Date(item.createdAt);
  const formattedDate = createdAt.toLocaleDateString("ru-RU", {
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

      {/* Карточка вещи */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Галерея изображений */}
        <div className="p-6 pb-4">
          <ImageGallery images={item.images} title={item.title} />
        </div>

        {/* Информация о вещи */}
        <div className="px-6 pb-6">
          {/* Заголовок и категория */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {item.title}
                </h1>
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                  {item.category}
                </span>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  item.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.isActive ? "Доступна" : "Недоступна"}
              </span>
            </div>
          </div>

          {/* Цена и залог */}
          <div className="mb-6 flex gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex-1">
              <p className="text-xs text-gray-500">Цена аренды</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {item.pricePerDay.toLocaleString("ru-RU")} ₽
                <span className="ml-1 text-sm font-normal text-gray-500">
                  / день
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex-1">
              <p className="text-xs text-gray-500">Залог</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {item.depositAmount.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>

          {/* Описание */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Описание</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">
              {item.description}
            </p>
          </div>

          {/* Информация о владельце и отзывы */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Информация о владельце */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Владелец
              </h2>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/users/${item.owner.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {item.owner.name
                        ? item.owner.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.owner.name || "Без имени"}
                      </p>
                      <p className="text-sm text-gray-500">{item.owner.email}</p>
                    </div>
                  </Link>
                </div>

                {/* Рейтинг владельца */}
                {ownerReviews && ownerReviews.reviewCount > 0 && (
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-4 w-4"
                          fill={
                            star <= Math.round(ownerReviews.averageRating)
                              ? "#F59E0B"
                              : "#D1D5DB"
                          }
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {ownerReviews.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({ownerReviews.reviewCount} отзыв
                      {getReviewWord(ownerReviews.reviewCount)})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Дата добавления */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Информация
              </h2>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    <p className="text-sm text-gray-700">{formattedDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20.25 8.511c1.44-.59 1.437-2.043 0-2.613-1.49-.578-6.459-1.238-9.75-1.238-3.291 0-8.26.66-9.75 1.238-1.44.57-1.437 2.023 0 2.613 1.49.578 6.459 1.238 9.75 1.238 3.291 0 8.26-.66 9.75-1.238z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20.25 12.75c1.44-.59 1.437-2.043 0-2.613-1.49-.578-6.459-1.238-9.75-1.238-3.291 0-8.26.66-9.75 1.238-1.44.57-1.437 2.023 0 2.613 1.49.578 6.459 1.238 9.75 1.238 3.291 0 8.26-.66 9.75-1.238z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20.25 17c1.44-.59 1.437-2.043 0-2.613-1.49-.578-6.459-1.238-9.75-1.238-3.291 0-8.26.66-9.75 1.238-1.44.57-1.437 2.023 0 2.613 1.49.578 6.459 1.238 9.75 1.238 3.291 0 8.26-.66 9.75-1.238z"
                      />
                    </svg>
                    <p className="text-sm text-gray-700">
                      ID: {item.id.slice(0, 8)}…
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Локация */}
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Локация
            </h2>
            {item.latitude != null && item.longitude != null ? (
              <MiniMap
                lat={item.latitude}
                lng={item.longitude}
                title={item.title}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-4 text-gray-500">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span className="text-sm">Локация не указана</span>
              </div>
            )}
          </div>

          {/* Последние отзывы о владельце */}
          {ownerReviews && ownerReviews.reviews.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Последние отзывы о владельце
              </h2>
              <ReviewDisplay
                reviews={ownerReviews.reviews}
                averageRating={ownerReviews.averageRating}
                reviewCount={ownerReviews.reviewCount}
                limit={3}
              />
            </div>
          )}

          {/* Календарь бронирования */}
          <div className="mt-8">
            <BookingCalendar
              itemId={item.id}
              pricePerDay={item.pricePerDay}
              depositAmount={item.depositAmount}
              isOwner={item.owner.id === currentUserId}
            />
          </div>
        </div>
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
