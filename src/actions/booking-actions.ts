"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

type StatusAction =
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "ACTIVE"
  | "RETURNED"
  | "COMPLETED";

/**
 * Базовая функция обновления статуса бронирования через API.
 */
async function _updateBookingStatus(
  bookingId: string,
  status: StatusAction
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();

  if (!session || !session.user?.id) {
    return { ok: false, error: "Требуется аутентификация" };
  }

  const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const data = await res.json();
    return { ok: false, error: data.error ?? "Ошибка при обновлении статуса" };
  }

  revalidatePath("/bookings/my");
  revalidatePath("/bookings/received");
  revalidatePath(`/bookings/${bookingId}`);

  return { ok: true };
}

/**
 * Универсальное обновление статуса бронирования.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: StatusAction
) {
  const result = await _updateBookingStatus(bookingId, status);
  if (!result.ok) {
    throw new Error(result.error);
  }
}

/**
 * Арендатор подтверждает получение вещи (CONFIRMED → ACTIVE).
 */
export async function confirmReceipt(bookingId: string) {
  const result = await _updateBookingStatus(bookingId, "ACTIVE");
  if (!result.ok) {
    throw new Error(result.error);
  }
}

/**
 * Владелец подтверждает возврат вещи (ACTIVE → RETURNED → COMPLETED).
 */
export async function confirmReturn(bookingId: string) {
  const result = await _updateBookingStatus(bookingId, "RETURNED");
  if (!result.ok) {
    throw new Error(result.error);
  }
}

/**
 * Отмена бронирования (любой участник, любой допустимый статус).
 */
export async function cancelBooking(bookingId: string) {
  const result = await _updateBookingStatus(bookingId, "CANCELLED");
  if (!result.ok) {
    throw new Error(result.error);
  }
}
