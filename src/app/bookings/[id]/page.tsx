import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BookingChat from "@/components/BookingChat";
import BookingTimeline from "@/components/BookingTimeline";
import BookingActions from "@/components/BookingActions";
import ReviewForm from "@/components/ReviewForm";
import ReviewDisplay from "@/components/ReviewDisplay";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const labels: Record<string, string> = {
    PENDING: "Ожидает",
    CONFIRMED: "Подтверждена",
    ACTIVE: "Активна",
    COMPLETED: "Завершена",
    CANCELLED: "Отменена",
    REJECTED: "Отклонена",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  // Проверка аутентификации
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  // Загрузка брони с данными вещи, владельца и арендатора
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      item: {
        include: {
          owner: true,
        },
      },
      renter: true,
      reviews: {
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Бронь не найдена
  if (!booking) {
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
            Бронь не найдена
          </h1>
          <p className="mt-2 text-gray-600">
            Возможно, она была удалена или вы ввели неверную ссылку.
          </p>
          <Link
            href="/bookings/my"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Мои брони
          </Link>
        </div>
      </div>
    );
  }

  // Проверка доступа: пользователь должен быть renter брони или owner вещи
  const isRenter = booking.renterId === currentUserId;
  const isOwner = booking.item.ownerId === currentUserId;

  if (!isRenter && !isOwner) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-white p-12 text-center shadow-sm">
          <svg
            className="mx-auto h-16 w-16 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Доступ запрещён
          </h1>
          <p className="mt-2 text-gray-600">
            У вас нет доступа к этой брони.
          </p>
          <Link
            href="/bookings/my"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Мои брони
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount =
    typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : (booking.totalAmount as { toNumber: () => number }).toNumber();
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatDateTime = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Навигационная ссылка */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/bookings/my"
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
          Назад к моим броням
        </Link>
      </div>

      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Детали брони</h1>
      </div>

      {/* Карточка с информацией о брони */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          {/* Вещь */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Вещь</h2>
            <Link
              href={`/items/${booking.item.id}`}
              className="mt-1 inline-block text-xl font-bold text-blue-600 hover:underline"
            >
              {booking.item.title}
            </Link>
          </div>

          {/* Участники */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500">Владелец вещи</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {booking.item.owner.name || booking.item.owner.email}
              </p>
              <p className="text-sm text-gray-600">{booking.item.owner.email}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500">Арендатор</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {booking.renter.name || booking.renter.email}
              </p>
              <p className="text-sm text-gray-600">{booking.renter.email}</p>
            </div>
          </div>

          {/* Даты */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500">Дата начала</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatDateTime(startDate)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-500">Дата окончания</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatDateTime(endDate)}
              </p>
            </div>
          </div>

          {/* Статус и цена */}
          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Статус</p>
              <div className="mt-1">{getStatusBadge(booking.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Сумма</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalAmount.toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Таймлайн и действия */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Таймлайн жизненного цикла */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Жизненный цикл
          </h2>
          <BookingTimeline
            status={booking.status}
            confirmedAt={booking.confirmedAt}
            receivedAt={booking.receivedAt}
            returnedAt={booking.returnedAt}
            completedAt={booking.completedAt}
            cancelledAt={booking.cancelledAt}
            depositHeld={booking.depositHeld}
          />
        </div>

        {/* Кнопки действий */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Действия
          </h2>
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            isRenter={isRenter}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* Отзывы */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Отзывы</h2>

        {/* Показ отзывов по бронированию */}
        <div className="mb-6">
          <ReviewDisplay
            reviews={booking.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt.toISOString(),
              author: r.author,
            }))}
          />
        </div>

        {/* Форма отзыва для COMPLETED бронирований */}
        {booking.status === "COMPLETED" && (
          <>
            {/* Проверяем, оставил ли текущий пользователь отзыв */}
            {(() => {
              const hasReview = booking.reviews.some(
                (r) => r.authorId === currentUserId
              );
              if (hasReview) return null;

              // Определяем, кого оценивает текущий пользователь
              let targetName = "";
              if (isRenter) {
                targetName =
                  booking.item.owner.name || booking.item.owner.email;
              } else if (isOwner) {
                targetName = booking.renter.name || booking.renter.email;
              }

              return (
                <ReviewForm
                  bookingId={booking.id}
                  targetName={targetName}
                  onSuccess={() => {
                    // Перезагрузка страницы для обновления списка отзывов
                    window.location.reload();
                  }}
                />
              );
            })()}
          </>
        )}
      </div>

      {/* Чат */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Чат</h2>
        <BookingChat bookingId={booking.id} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
