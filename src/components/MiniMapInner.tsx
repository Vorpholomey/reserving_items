"use client";

import { useMemo } from "react";

interface MiniMapInnerProps {
  lat: number;
  lng: number;
  title: string;
}

export default function MiniMapInner({ lat, lng, title }: MiniMapInnerProps) {
  const iframeSrc = useMemo(() => {
    // Small bounding box around the marker point
    const latDelta = 0.02;
    const lngDelta = 0.02;
    const bounds = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`;
    return `https://www.openstreetmap.org/export/embed?bbox=${bounds}&layer=mapnik&marker=${lat},${lng}`;
  }, [lat, lng]);

  return (
    <div className="relative h-52 overflow-hidden rounded-xl border border-gray-200">
      {/* OpenStreetMap iframe with native marker */}
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={iframeSrc}
        className="h-full w-full rounded-xl"
        title={`Карта: ${title}`}
        style={{ border: 0 }}
      />
    </div>
  );
}
