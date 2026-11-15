"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths in Next.js — only runs in browser
delete (L.Icon.Default.prototype as {_getIconUrl?: () => void})._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapItem {
  id: string;
  title: string;
  pricePerDay: number;
  lat: number | null;
  lng: number | null;
}

interface ItemsMapInnerProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
}

// Component to update map bounds when items change
function FitBounds({ items }: { items: MapItem[] }) {
  const map = useMap();

  useEffect(() => {
    const geoItems = items.filter(
      (item) => item.lat != null && item.lng != null
    );
    if (geoItems.length > 0) {
      const bounds = L.latLngBounds(
        geoItems.map((item) => [item.lat!, item.lng!])
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [items, map]);

  return null;
}

export default function ItemsMapInner({
  items,
  center = [55.751244, 37.618423],
  zoom = 5,
}: ItemsMapInnerProps) {
  const geoItems = useMemo(
    () => items.filter((item) => item.lat != null && item.lng != null),
    [items]
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-xl"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoItems.map((item) => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
        >
          <Popup>
            <div className="min-w-[180px]">
              <h3 className="mb-1 font-semibold text-gray-900">{item.title}</h3>
              <p className="mb-2 text-sm text-gray-600">
                {typeof item.pricePerDay === "number"
                  ? item.pricePerDay
                  : item.pricePerDay.toNumber()}{" "}
                ₽ / день
              </p>
              <a
                href={`/items/${item.id}`}
                className="inline-block rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Подробнее
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      {geoItems.length > 0 && <FitBounds items={geoItems} />}
    </MapContainer>
  );
}
