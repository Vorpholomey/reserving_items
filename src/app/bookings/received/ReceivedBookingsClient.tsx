"use client";

import Link from "next/link";
import { useState } from "react";

interface Booking {
  id: string;
  itemId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  totalAmount: { toNumber?: () => number } | number;
  status: string;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    title: string;
  };
  renter: {
    id: string;
    name: string | null;
    email: string;
  };
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    REJECTED: "bg-red-100 text-red-800",
    RETURNED: "bg-purple-100 text-purple-800",
  };

  const labels: Record<string, string> = {
    PENDING: "Ожидает",
    CONFIRMED: "Подтверждена",
    ACTIVE: "Активна",
    COMPLETED: "Завершена",
    CANCELLED: "Отменена",
    REJECTED: "Отклонена",
    RETURNED: "Возвращена",
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

/**
 * Обновляет статус бронирования через API.
 */
async function updateBookingStatus(
  bookingId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json();
    return { ok: false, error: data.error ?? "Ошибка при обновлении статуса" };
  }

  return { ok: true };
}

function BookingCard({ booking }: { booking: Booking }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const totalAmount =
    typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : (booking.totalAmount as { toNumber: () => number }).toNumber();
  const startDate = new Date(booking.startDate).toLocaleDateString("ru-RU");
  const endDate = new Date(booking.endDate).toLocaleDateString("ru-RU");
  const renterName = booking.renter.name || booking.renter.email;

  const handleStatusChange = async (newStatus: string) => {
    setPending(true);
    setError(null);
    const result = await updateBookingStatus(booking.id, newStatus);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Неизвестная ошибка");
    }
    // При успехе страница переотрисовывается через revalidatePath в API
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {booking.item.title}
          </h3>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
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
              {renterName}
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
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
              {startDate} — {endDate}
            </div>
          </div>
          <div className="mt-2">{getStatusBadge(booking.status)}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xl font-bold text-gray-900">
            {totalAmount.toLocaleString("ru-RU")} ₽
          </span>

          <Link
            href={`/bookings/${booking.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Чат
          </Link>

          {error && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {booking.status === "PENDING" && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatusChange("CONFIRMED")}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStatusChange("REJECTED")}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Отклонить
                </button>
              </>
            )}
            {booking.status === "CONFIRMED" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleStatusChange("ACTIVE")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Подтвердить начало
              </button>
            )}
            {booking.status === "ACTIVE" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleStatusChange("RETURNED")}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Подтвердить возврат
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceivedBookingsClient({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Входящие брони
      </h1>

      {bookings.length === 0 ? (
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
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Нет входящих бронирований
          </h2>
          <p className="mt-2 text-gray-600">
            Когда кто-то забронирует вашу вещь, заявка появится здесь
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
