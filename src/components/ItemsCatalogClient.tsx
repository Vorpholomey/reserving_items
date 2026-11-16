"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ItemsMap from "@/components/ItemsMap";
import ItemCard from "@/components/ItemCard";

interface CatalogItem {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  lat: number | null;
  lng: number | null;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  distance?: number;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ItemsCatalogClientProps {
  items: CatalogItem[];
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

// Вычисляем zoom на основе радиуса поиска.
// Маленький радиус → высокий zoom (ближе), большой радиус → низкий zoom (дальше).
// Радиус 1 км  → zoom ~15
// Радиус 50 км → zoom ~10
function radiusToZoom(radiusKm: number): number {
  // Логарифмическая интерполяция:
  // zoom = 15 - (log10(radiusKm) / log10(50)) * 5
  // При radiusKm=1:  log10(1)=0  → zoom=15
  // При radiusKm=50:  log10(50)=1.7 → zoom=10
  const zoom = 15 - (Math.log10(radiusKm) / Math.log10(50)) * 5;
  return Math.round(zoom);
}

export default function ItemsCatalogClient({
  items,
  initialLat,
  initialLng,
  initialRadius,
}: ItemsCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [radius, setRadius] = useState(initialRadius ?? 25);
  const [userLat, setUserLat] = useState<number | null>(initialLat ?? null);
  const [userLng, setUserLng] = useState<number | null>(initialLng ?? null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Автоматически определить геопозицию при первом открытии страницы
  useEffect(() => {
    // Если сервер уже передал координаты — ничего делать не нужно
    if (initialLat != null && initialLng != null) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      },
      () => { /* тихо проигнорировать ошибку — пользователь может нажать кнопку */ },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []); // пустая dependency array — выполнить один раз при монтировании

  // Map items to format expected by ItemsMap
  const mapItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    pricePerDay: item.pricePerDay,
    lat: item.lat,
    lng: item.lng,
  }));

  const mapCenter: [number, number] =
    userLat != null && userLng != null
      ? [userLat, userLng]
      : [55.751244, 37.618423]; // Москва по умолчанию

  // Update URL when radius changes
  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadius(newRadius);

      if (userLat != null && userLng != null) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", userLat.toString());
        params.set("lng", userLng.toString());
        params.set("radius", newRadius.toString());
        router.push(`/items?${params.toString()}`, { scroll: false });
      }
    },
    [userLat, userLng, searchParams, router]
  );

  // Trigger navigation when radius slider changes
  const handleRadiusCommit = useCallback(
    (newRadius: number) => {
      if (userLat != null && userLng != null) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", userLat.toString());
        params.set("lng", userLng.toString());
        params.set("radius", newRadius.toString());
        router.push(`/items?${params.toString()}`);
      }
    },
    [userLat, userLng, searchParams, router]
  );

  // Get user location
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", lat.toString());
        params.set("lng", lng.toString());
        params.set("radius", radius.toString());
        router.push(`/items?${params.toString()}`);
        setLoadingLocation(false);
      },
      (error) => {
        setLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Доступ к геолокации запрещён. Разрешите в настройках браузера.");
        } else {
          alert("Не удалось определить ваше местоположение");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius, searchParams, router]);

  return (
    <div className="flex flex-col gap-6">
      {/* Map + Filter Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Sidebar with filters */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Фильтры</h2>

            {/* Radius Slider */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Радиус:{" "}
                <span className="font-bold text-blue-600">
                  {radius < 1
                    ? `${Math.round(radius * 1000)} м`
                    : `${radius} км`}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                onMouseUp={() => handleRadiusCommit(radius)}
                onTouchEnd={() => handleRadiusCommit(radius)}
                className="w-full cursor-pointer accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>1 км</span>
                <span>50 км</span>
              </div>
            </div>

            {/* Geolocation Button */}
            <button
              onClick={handleGetLocation}
              disabled={loadingLocation}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingLocation ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Определение…
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Определить мою позицию
                </>
              )}
            </button>

            {/* Item count */}
            <div className="mt-4 text-sm text-gray-500">
              Найдено вещей:{" "}
              <span className="font-semibold text-gray-900">{items.length}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <div className="h-[400px] w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <ItemsMap items={mapItems} center={mapCenter} zoom={radiusToZoom(radius)} />
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4 h-16 w-16 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            Вещей не найдено
          </h3>
          <p className="text-gray-500">
            {userLat != null
              ? "Попробуйте увеличить радиус поиска или изменить местоположение"
              : "Пока никто не добавил вещи в ваш район"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              pricePerDay={item.pricePerDay}
              depositAmount={item.depositAmount}
              category={item.category}
              images={item.images}
              distance={item.distance ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
