import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";

async function SessionContent() {
  const session = await auth();

  return (
    <>
      {session?.user && (
        <div className="mb-8 inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full">
          Привет,{" "}
          <span className="font-semibold">
            {session.user.name || session.user.email}
          </span>
          {"!"}{ }
          <Link
            href="/dashboard?tab=items"
            className="underline hover:text-indigo-900"
          >
            Добавьте свою первую вещь
          </Link>
        </div>
      )}

      {!session ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Начать бесплатно
          </Link>
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-8 py-3 rounded-full text-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Уже есть аккаунт
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/items"
            className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Смотреть все вещи
          </Link>
          <Link
            href="/items/create"
            className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
          >
            + Добавить вещь
          </Link>
        </div>
      )}
    </>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Аренда вещей{" "}
            <span className="text-indigo-600">рядом с вами</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Находите, бронируйте и сдавайте в аренду вещи среди соседей.
            Экономьте деньги и пространство — используйте то, что нужно, когда
            нужно.
          </p>

          <Suspense fallback={null}>
            <SessionContent />
          </Suspense>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 mt-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск вещей для аренды..."
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-16"
                readOnly
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Легкий поиск
            </h3>
            <p className="text-gray-600">
              Находите нужные вещи среди предложений соседей за секунды
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Простое бронирование
            </h3>
            <p className="text-gray-600">
              Бронируйте вещи в один клик с удобным календарем доступности
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Зарабатывайте
            </h3>
            <p className="text-gray-600">
              Сдавайте inutilizable вещи в аренду и получайте дополнительный
              доход
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
