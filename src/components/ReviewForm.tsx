"use client";

import { useState } from "react";
import { submitReview } from "@/actions/review-actions";

interface ReviewFormProps {
  bookingId: string;
  targetName: string;
  onSuccess?: () => void;
}

export default function ReviewForm({
  bookingId,
  targetName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Пожалуйста, выберите оценку");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitReview(bookingId, rating, comment || undefined);
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при отправке отзыва");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-green-800">
          Отзыв отправлен!
        </h3>
        <p className="mt-1 text-sm text-green-700">
          Спасибо за ваш отзыв о {targetName}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Оставить отзыв о {targetName}
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Звёздочный рейтинг */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Оценка
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-colors focus:outline-none"
                aria-label={`${star} из 5 звёзд`}
              >
                <svg
                  className="h-8 w-8"
                  fill={
                    star <= (hoverRating || rating)
                      ? "#F59E0B"
                      : "#D1D5DB"
                  }
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {["", "Ужасно", "Плохо", "Нормально", "Хорошо", "Отлично"][
                rating
              ]}
            </p>
          )}
        </div>

        {/* Комментарий */}
        <div className="mb-4">
          <label
            htmlFor="comment"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Комментарий <span className="text-gray-400">(необязательно)</span>
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Расскажите о вашем опыте..."
          />
        </div>

        {/* Ошибка */}
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        {/* Кнопка */}
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Отправка..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
}
