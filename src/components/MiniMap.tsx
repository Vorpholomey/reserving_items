"use client";

import dynamic from "next/dynamic";

interface MiniMapProps {
  lat: number;
  lng: number;
  title: string;
}

const MiniMapInner = dynamic(
  () => import("./MiniMapInner"),
  { ssr: false, loading: () => <div className="h-52 animate-pulse rounded-xl bg-gray-200" /> }
);

export default function MiniMap({ lat, lng, title }: MiniMapProps) {
  return <MiniMapInner lat={lat} lng={lng} title={title} />;
}
