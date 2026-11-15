"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl bg-gray-100">
        <div className="text-center">
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
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Нет изображений</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Главное изображение */}
      <div className="overflow-hidden rounded-xl bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={`${title} — изображение ${currentIndex + 1}`}
          className="h-80 w-full object-cover transition-opacity duration-200"
        />
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === currentIndex
                  ? "border-blue-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Показать изображение ${index + 1}`}
            >
              <img
                src={img}
                alt={`Миниатюра ${index + 1}`}
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
