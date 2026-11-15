"use client";

import Link from "next/link";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  category: string;
  images: string[];
  distance?: number | null;
}

export default function ItemCard({
  id,
  title,
  description,
  pricePerDay,
  depositAmount,
  category,
  images,
  distance,
}: ItemCardProps) {
  const price = pricePerDay;
  const deposit = depositAmount;
  const firstImage = images[0] || null;

  return (
    <Link
      href={`/items/${id}`}
      className="block rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100">
        {firstImage ? (
          <img
            src={firstImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {category}
          </span>
          {distance != null && distance > 0 && (
            <span className="text-xs text-gray-500">
              {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
            </span>
          )}
        </div>

        <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900">
          {title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm text-gray-500">
          {description}
        </p>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {price.toLocaleString("ru-RU")} ₽
            </span>
            <span className="text-sm text-gray-500"> / день</span>
          </div>
          {deposit > 0 && (
            <span className="text-xs text-gray-500">
              Залог: {deposit.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
