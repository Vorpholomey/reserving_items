"use client";

import { useState, useEffect, useCallback } from "react";
import ItemsMap from "./ItemsMap";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number } | null;
  zoom?: number;
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  zoom = 10,
}: LocationPickerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [mapZoom, setMapZoom] = useState(zoom);

  // Обновляем внутренний стейт при изменении initialLocation
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const newLocation = { lat, lng };
      setLocation(newLocation);
      onLocationSelect(lat, lng);
    },
    [onLocationSelect]
  );

  const handleZoomIn = () => {
    setMapZoom((z) => Math.min(z + 1, 18));
  };

  const handleZoomOut = () => {
    setMapZoom((z) => Math.max(z - 1, 1));
  };

  const center: [number, number] = location
    ? [location.lat, location.lng]
    : [55.751244, 37.618423];

  return (
    <div className="flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200"
          title="Приблизить"
        >
          +
        </button>
        <span className="text-sm text-gray-500">Zoom: {mapZoom}</span>
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200"
          title="Отдалить"
        >
          −
        </button>
      </div>

      {/* Map */}
      <div className="h-80 w-full overflow-hidden rounded-xl">
        <ItemsMap
          items={[]}
          center={center}
          zoom={mapZoom}
          onMapClick={handleMapClick}
          selectedLocation={location}
          enableInteraction={true}
        />
      </div>

      {/* Coordinates display */}
      {location && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          <span className="font-medium">Выбранная точка:</span>{" "}
          {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°
        </div>
      )}
    </div>
  );
}
