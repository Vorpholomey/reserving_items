import { auth } from "@/lib/auth";
import { getMyItems } from "@/actions/item-actions";
import Link from "next/link";
import { Suspense } from "react";
import { Item } from "@prisma/client";

async function DashboardContent() {
  const session = await auth();
  const userName =
    session?.user?.name || session?.user?.email || "Пользователь";

  const items = await getMyItems();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Добро пожаловать, {userName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Панель управления вашим аккаунтом
          </p>
        </div>

        {/* Секции */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Мои вещи */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Мои вещи
              </h2>
              <Link
                href="/items/create"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Добавить вещь
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  У вас пока нет вещей. Добавьте свою первую вещь!
                </p>
                <Link
                  href="/items/create"
                  className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Добавить вещь
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: Item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="block rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
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
                          {item.category}
                        </span>
                      </div>

                      <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-gray-900">
                        {item.title}
                      </h3>

                      <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                        {item.description}
                      </p>

                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl font-bold text-gray-900">
                            {(item.pricePerDay as number).toLocaleString("ru-RU")} ₽
                          </span>
                          <span className="text-sm text-gray-500"> / день</span>
                        </div>
                        {(item.depositAmount as number) > 0 && (
                          <span className="text-xs text-gray-500">
                            Залог: {(item.depositAmount as number).toLocaleString("ru-RU")} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Бронирования */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Бронирования
            </h2>
            <p className="text-gray-500">В разработке</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
