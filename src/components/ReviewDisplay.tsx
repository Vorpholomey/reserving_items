interface ReviewDisplayProps {
  reviews: {
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
      item?: {
        id: string;
        title: string;
      };
    };
  }[];
  averageRating?: number;
  reviewCount?: number;
  limit?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="h-4 w-4"
          fill={star <= rating ? "#F59E0B" : "#D1D5DB"}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewDisplay({
  reviews,
  averageRating,
  reviewCount,
  limit,
}: ReviewDisplayProps) {
  const displayedReviews = limit ? reviews.slice(0, limit) : reviews;

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <svg
          className="mx-auto h-10 w-10 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-500">Отзывов пока нет</p>
      </div>
    );
  }

  return (
    <div>
      {/* Блок с рейтингом */}
      {averageRating != null && reviewCount != null && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-amber-700">
              {averageRating.toFixed(1)}
            </span>
            <StarRating rating={Math.round(averageRating)} />
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{reviewCount}</span> отзыв
            {getReviewWord(reviewCount)}
          </div>
        </div>
      )}

      {/* Список отзывов */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-gray-200 p-4"
          >
            {/* Автор и дата */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                  {review.author.name
                    ? review.author.name.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {review.author.name || "Аноним"}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Рейтинг */}
            <div className="mb-2">
              <StarRating rating={review.rating} />
            </div>

            {/* Вещь (если есть) */}
            {review.booking?.item && (
              <p className="mb-1 text-xs text-gray-400">
                за \"{review.booking.item.title}\"
              </p>
            )}

            {/* Комментарий */}
            {review.comment && (
              <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
            )}
          </div>
        ))}
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
