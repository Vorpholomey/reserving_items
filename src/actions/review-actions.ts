"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Отправить отзыв по бронированию.
 */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment?: string
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Требуется аутентификация");
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error("Рейтинг должен быть от 1 до 5");
  }

  const res = await fetch(`/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, comment }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Ошибка при отправке отзыва");
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/items");
  revalidatePath("/users");

  return res.json();
}

/**
 * Получить отзывы о пользователе.
 */
export async function getUserReviews(userId: string) {
  const res = await fetch(`/api/reviews?userId=${userId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Ошибка при загрузке отзывов");
  }

  return res.json();
}

/**
 * Получить отзывы по бронированию.
 */
export async function getBookingReviews(bookingId: string) {
  const res = await fetch(`/api/reviews?bookingId=${bookingId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Ошибка при загрузке отзывов");
  }

  return res.json();
}
