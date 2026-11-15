import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateBookingStatus } from "@/actions/booking-actions";
import { Suspense } from "react";

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

async function cancelBooking(bookingId: string) {
  "use server";
  await updateBookingStatus(bookingId, "CANCELLED");
}

async function loadBookings() {
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/bookings/my`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return { bookings: [] as Booking[], error: "Не удалось загрузить брони" };
  }
  const bookings = (await res.json()) as Booking[];
  return { bookings, error: null };
}

function BookingCard({ booking }: { booking: Booking }) {
  const totalAmount =
    typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : (booking.totalAmount as { toNumber: () => number }).toNumber();
  const startDate = new Date(booking.startDate).toLocaleDateString("ru-RU");
  const endDate = new Date(booking.endDate).toLocaleDateString("ru-RU");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Link
            href={`/items/${booking.item.id}`}
            className="text-lg font-semibold text-blue-600 hover:underline"
          >
            {booking.item.title}
          </Link>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
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
            </span>
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
          {booking.status === "PENDING" && (
            <form
              action={async () => {
                await cancelBooking(booking.id);
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                Отменить
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

async function BookingsList() {
  const { bookings, error } = await loadBookings();

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

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
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            У вас пока нет бронирований
          </h2>
          <p className="mt-2 text-gray-600">
            Выберите вещь в каталоге и забронируйте её на удобные даты
          </p>
          <Link
            href="/items"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Перейти к каталогу
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}

export default function MyBookingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Мои брони</h1>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <BookingsList />
      </Suspense>
    </div>
  );
}
