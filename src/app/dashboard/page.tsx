import { auth } from "@/lib/auth";
import { Suspense } from "react";

async function DashboardContent() {
  const session = await auth();
  const userName =
    session?.user?.name || session?.user?.email || "Пользователь";

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

        {/* Секции-заглушки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Мои вещи */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Мои вещи
            </h2>
            <p className="text-gray-500">В разработке</p>
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
