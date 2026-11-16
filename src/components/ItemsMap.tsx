"use client";

import dynamic from "next/dynamic";

interface MapItem {
  id: string;
  title: string;
  pricePerDay: number;
  lat: number | null;
  lng: number | null;
}

interface ItemsMapProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  enableInteraction?: boolean;
}

const MapComponent = dynamic(
  () => import("./ItemsMapInner"),
  { ssr: false, loading: () => <div className="h-full w-full rounded-xl bg-gray-200 animate-pulse" /> }
);

export default function ItemsMap({ items, center, zoom, onMapClick, selectedLocation, enableInteraction }: ItemsMapProps) {
  return (
    <MapComponent
      items={items}
      center={center}
      zoom={zoom}
      onMapClick={onMapClick}
      selectedLocation={selectedLocation}
      enableInteraction={enableInteraction}
    />
  );
}
