"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateItemInput {
  title: string;
  description: string;
  pricePerDay: number;
  depositAmount: number;
  category: string;
  images: string[];
  latitude?: number;
  longitude?: number;
}

export interface ItemWithOwner {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  pricePerDay: Decimal | number;
  depositAmount: Decimal | number;
  latitude: number | null;
  longitude: number | null;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface ItemWithDistance {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  pricePerDay: Decimal | number;
  depositAmount: Decimal | number;
  lat: number | null;
  lng: number | null;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  distance: number;
}

// ─── Create Item ───────────────────────────────────────────────

export async function createItem(data: CreateItemInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Требуется авторизация для создания вещи");
  }

  const { title, description, pricePerDay, depositAmount, category, images, latitude, longitude } = data;

  // Серверная валидация
  if (!title || title.trim().length === 0) {
    throw new Error("Название не может быть пустым");
  }
  if (!description || description.trim().length === 0) {
    throw new Error("Описание не может быть пустым");
  }
  if (!category || category.trim().length === 0) {
    throw new Error("Категория не может быть пустой");
  }
  if (pricePerDay == null || pricePerDay <= 0) {
    throw new Error("Цена за день должна быть больше 0");
  }
  if (depositAmount == null || depositAmount < 0) {
    throw new Error("Залог не может быть отрицательным");
  }

  const item = await prisma.item.create({
    data: {
      ownerId: session.user.id,
      title,
      description,
      pricePerDay: new Decimal(pricePerDay),
      depositAmount: new Decimal(depositAmount),
      category,
      images,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  });

  return item;
}

// ─── Get Active Items (with optional geo-filter) ──────────────────────────

export async function getActiveItems(options?: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}) {
  const { latitude, longitude, radiusKm } = options || {};

  // Валидация geo-параметров
  const hasGeo =
    latitude != null && longitude != null && radiusKm != null && radiusKm > 0;
  if (hasGeo) {
    if (Math.abs(latitude) > 90) {
      throw new Error("Широта должна быть в диапазоне от -90 до 90");
    }
    if (Math.abs(longitude) > 180) {
      throw new Error("Долгота должна быть в диапазоне от -180 до 180");
    }
    if (radiusKm > 500) {
      throw new Error("Радиус не может превышать 500 км");
    }
  }

  // Если переданы координаты и радиус — используем Haversine через raw SQL
  if (hasGeo) {
    const results = await prisma.$queryRaw<ItemWithDistance[]>`
      SELECT
        items.id,
        items."ownerId",
        items.title,
        items.description,
        items."pricePerDay",
        items."depositAmount",
        items.lat,
        items.lng,
        items.category,
        items.images,
        items."isActive",
        items."createdAt",
        (6371 * acos(
          cos(radians(${latitude})) * cos(radians(items.lat)) *
          cos(radians(items.lng) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(items.lat))
        )) AS distance
      FROM items
      WHERE items."isActive" = true
        AND items.lat IS NOT NULL
        AND items.lng IS NOT NULL
        AND (6371 * acos(
          cos(radians(${latitude})) * cos(radians(items.lat)) *
          cos(radians(items.lng) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(items.lat))
        )) <= ${radiusKm}
      ORDER BY distance
    `;

    return results;
  }

  // Без гео-фильтра — обычный запрос через Prisma
  const items = await prisma.item.findMany({
    where: {
      isActive: true,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items as unknown as ItemWithOwner[];
}

// ─── Get Item by ID ─────────────────────────────────────────────

export async function getItemById(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error("Вещь не найдена");
  }

  return item as unknown as ItemWithOwner;
}

// ─── Update Item Status (activate / deactivate) ──────────────────────

export async function updateItemStatus(id: string, isActive: boolean) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Требуется авторизация для изменения статуса вещи");
  }

  // Проверяем, что вещь принадлежит текущему пользователю
  const item = await prisma.item.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!item) {
    throw new Error("Вещь не найдена");
  }

  if (item.ownerId !== session.user.id) {
    throw new Error("У вас нет прав для изменения статуса этой вещи");
  }

  const updatedItem = await prisma.item.update({
    where: { id },
    data: { isActive },
  });

  return updatedItem;
}
