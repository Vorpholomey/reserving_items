import { Suspense } from "react";
import Link from "next/link";
import { getActiveItems, type ItemWithOwner, type ItemWithDistance } from "@/actions/item-actions";
import ItemsCatalogClient from "@/components/ItemsCatalogClient";

interface SearchParams {
  lat?: string;
  lng?: string;
  radius?: string;
}

// Helper to convert Prisma Decimal (or number) to plain number
function decimalToNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber(): number }).toNumber === "function") {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
}

// Unify item shape for the client component
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

function normalizeItem(
  item: ItemWithOwner | ItemWithDistance
): CatalogItem {
  // ItemWithDistance has lat/lng/distance (from raw SQL)
  // ItemWithOwner has latitude/longitude/owner (from Prisma ORM)
  const isGeo = "distance" in item;

  if (isGeo) {
    const geoItem = item as ItemWithDistance;
    return {
      id: geoItem.id,
      title: geoItem.title,
      description: geoItem.description,
      pricePerDay: decimalToNumber(geoItem.pricePerDay),
      depositAmount: decimalToNumber(geoItem.depositAmount),
      lat: geoItem.lat,
      lng: geoItem.lng,
      category: geoItem.category,
      images: geoItem.images,
      isActive: geoItem.isActive,
      createdAt: geoItem.createdAt,
      distance: geoItem.distance,
      // ItemWithDistance from raw SQL doesn't have owner — provide minimal fallback
      owner: { id: geoItem.ownerId, name: null, email: "" },
    };
  } else {
    const ownerItem = item as ItemWithOwner;
    return {
      id: ownerItem.id,
      title: ownerItem.title,
      description: ownerItem.description,
      pricePerDay: decimalToNumber(ownerItem.pricePerDay),
      depositAmount: decimalToNumber(ownerItem.depositAmount),
      lat: ownerItem.latitude ?? null,
      lng: ownerItem.longitude ?? null,
      category: ownerItem.category,
      images: ownerItem.images,
      isActive: ownerItem.isActive,
      createdAt: ownerItem.createdAt,
      distance: undefined,
      owner: ownerItem.owner,
    };
  }
}

export default async function ItemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const latitude = params.lat ? Number(params.lat) : undefined;
  const longitude = params.lng ? Number(params.lng) : undefined;
  const radiusKm = params.radius ? Number(params.radius) : undefined;

  const hasGeoFilter =
    latitude != null &&
    longitude != null &&
    radiusKm != null &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    !isNaN(radiusKm);

  let rawItems: (ItemWithOwner | ItemWithDistance)[] = [];

  if (hasGeoFilter) {
    rawItems = await getActiveItems({
      latitude,
      longitude,
      radiusKm,
    });
  } else {
    rawItems = await getActiveItems();
  }

  const items: CatalogItem[] = rawItems.map(normalizeItem);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Каталог вещей</h1>
        <Link
          href="/items/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Добавить вещь
        </Link>
      </div>

      {/* Map + Filters + Items List */}
      <Suspense fallback={<div className="text-center text-gray-500">Загрузка...</div>}>
        <ItemsCatalogClient
          items={items}
          initialLat={latitude}
          initialLng={longitude}
          initialRadius={radiusKm}
        />
      </Suspense>
    </div>
  );
}
