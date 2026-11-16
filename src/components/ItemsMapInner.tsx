"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";

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
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  enableInteraction?: boolean;
}

// Mercator projection helpers
function latToY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

function lngToX(lng: number): number {
  return (lng + 180) / 360;
}

function getTileUrl(x: number, y: number, z: number): string {
  return `https://{s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function getRandomSubdomain() {
  const subs = ["a", "b", "c"];
  return subs[Math.floor(Math.random() * subs.length)];
}

// Reverse Mercator projection helpers (screen → geo)
function yToLat(y: number): number {
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI;
  return latRad;
}

function xToLng(x: number): number {
  return x * 360 - 180;
}


export default function ItemsMapInner({
  items,
  center = [55.751244, 37.618423],
  zoom = 5,
  onMapClick,
  selectedLocation,
  enableInteraction = false,
}: ItemsMapInnerProps) {
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const subdomainRef = useRef(getRandomSubdomain());

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ width, height });
    return () => observer.disconnect();
  }, []);

  const geoItems = useMemo(
    () => items.filter((item) => item.lat != null && item.lng != null),
    [items]
  );

  // Compute tile grid and marker positions
  const { tiles, markerPositions } = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { tiles: [] as { url: string; left: number; top: number }[], markerPositions: new Map<string, { x: number; y: number }>() };
    }

    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    const earthPixels = tileSize * scale;

    // Center of the map in pixel coords
    const centerX = lngToX(center[1]) * earthPixels;
    const centerY = latToY(center[0]) * earthPixels;

    // Container center in pixels
    const containerCenterX = containerSize.width / 2;
    const containerCenterY = containerSize.height / 2;

    // Offset from top-left of container to map origin
    // panOffset shifts the map view: positive panOffset means the map moved right/down,
    // so the underlying pixel coords shift left/up
    const offsetX = centerX - containerCenterX - panOffset.x;
    const offsetY = centerY - containerCenterY - panOffset.y;

    // Determine visible tile range
    const startTileX = Math.floor((offsetX) / tileSize);
    const endTileX = Math.floor((offsetX + containerSize.width) / tileSize);
    const startTileY = Math.floor((offsetY) / tileSize);
    const endTileY = Math.floor((offsetY + containerSize.height) / tileSize);

    const maxTile = Math.pow(2, zoom) - 1;
    const tiles: { url: string; left: number; top: number }[] = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        // Wrap X for world wrapping, clamp Y
        const wrappedTx = ((tx % (maxTile + 1)) + (maxTile + 1)) % (maxTile + 1);
        const clampedTy = Math.max(0, Math.min(ty, maxTile));
        if (clampedTy < 0 || clampedTy > maxTile) continue;

        const left = tx * tileSize - offsetX;
        const top = ty * tileSize - offsetY;
        tiles.push({
          url: getTileUrl(wrappedTx, clampedTy, zoom).replace("{s}", subdomainRef.current),
          left,
          top,
        });
      }
    }

    // Compute marker positions in container coords
    const markerPositions = new Map<string, { x: number; y: number }>();
    geoItems.forEach((item) => {
      const mx = lngToX(item.lng!) * earthPixels - offsetX;
      const my = latToY(item.lat!) * earthPixels - offsetY;
      markerPositions.set(item.id, { x: mx, y: my });
    });

    return { tiles, markerPositions };
  }, [containerSize, center, zoom, geoItems, panOffset]);

  // Compute offset values (duplicate logic from useMemo for click handler access)
  const computeOffsets = useCallback(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return null;
    }
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    const earthPixels = tileSize * scale;
    const centerX = lngToX(center[1]) * earthPixels;
    const centerY = latToY(center[0]) * earthPixels;
    const containerCenterX = containerSize.width / 2;
    const containerCenterY = containerSize.height / 2;
    const offsetX = centerX - containerCenterX - panOffset.x;
    const offsetY = centerY - containerCenterY - panOffset.y;
    return { earthPixels, offsetX, offsetY };
  }, [containerSize, center, zoom, panOffset]);

  // Click handler to convert screen coordinates to geo coordinates
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onMapClick) return;
      const offsets = computeOffsets();
      if (!offsets) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const worldX = screenX + offsets.offsetX;
      const worldY = screenY + offsets.offsetY;
      const xFraction = worldX / offsets.earthPixels;
      const yFraction = worldY / offsets.earthPixels;

      const lng = xFraction * 360 - 180;
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * yFraction))) * 180 / Math.PI;

      onMapClick(lat, lng);
    },
    [onMapClick, computeOffsets]
  );

  // Drag/pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button
      if (e.button !== 0) return;
      // When enableInteraction is true, prevent drag to allow click-based location selection
      if (enableInteraction) {
        e.preventDefault();
        return;
      }
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y };
    },
    [panOffset, enableInteraction]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanOffset({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Compute selected location marker position
  const selectedLocationPosition = useMemo(() => {
    if (!selectedLocation || containerSize.width === 0 || containerSize.height === 0) {
      return null;
    }
    const tileSize = 256;
    const scale = Math.pow(2, zoom);
    const earthPixels = tileSize * scale;
    const centerX = lngToX(center[1]) * earthPixels;
    const centerY = latToY(center[0]) * earthPixels;
    const containerCenterX = containerSize.width / 2;
    const containerCenterY = containerSize.height / 2;
    const offsetX = centerX - containerCenterX - panOffset.x;
    const offsetY = centerY - containerCenterY - panOffset.y;
    const mx = lngToX(selectedLocation.lng) * earthPixels - offsetX;
    const my = latToY(selectedLocation.lat) * earthPixels - offsetY;
    return { x: mx, y: my };
  }, [selectedLocation, containerSize, center, zoom, panOffset]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl"
      style={{ backgroundColor: "#e5e7eb", cursor: enableInteraction ? "crosshair" : isDragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Tile layer */}
      {tiles.map((tile, i) => (
        <img
          key={`${tile.left}-${tile.top}-${i}`}
          src={tile.url}
          alt=""
          className="absolute select-none draggable:false"
          style={{
            left: tile.left,
            top: tile.top,
            width: 256,
            height: 256,
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={false}
        />
      ))}

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-600">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          © OpenStreetMap contributors
        </a>
      </div>

      {/* Markers */}
      {containerSize.width > 0 &&
        Array.from(markerPositions.entries()).map(([id, { x, y }]) => {
          const item = geoItems.find((i) => i.id === id);
          if (!item) return null;

          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={id}
              className="absolute z-20 -translate-x-1/2 -translate-y-full cursor-pointer"
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={() => {
                setSelectedItem((prev) =>
                  prev?.id === item.id ? null : item
                );
              }}
            >
              {/* SVG pin */}
              <svg
                width="28"
                height="40"
                viewBox="0 0 28 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
                style={{
                  transform: isSelected ? "scale(1.1)" : undefined,
                }}
              >
                <path
                  d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
                  fill={isSelected ? "#dc2626" : "#2563eb"}
                />
                <circle cx="14" cy="14" r="6" fill="white" />
              </svg>

              {/* Popup */}
              {isSelected && (
                <div
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-48 rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white ring-1 ring-black/5" />
                  <div className="mt-2">
                    <span className="font-medium text-gray-900">
                      {item.title}
                    </span>
                    <div className="text-sm text-gray-500">
                      {item.pricePerDay} ₽ / день
                    </div>
                    <a
                      href={`/items/${item.id}`}
                      className="mt-1 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Подробнее
                    </a>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="mt-1 block text-xs text-gray-500 hover:text-gray-700"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* Selected location marker (green pin) */}
      {selectedLocationPosition && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: `${selectedLocationPosition.x}px`, top: `${selectedLocationPosition.y}px` }}
        >
          <svg
            width="28"
            height="40"
            viewBox="0 0 28 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            <path
              d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
              fill="#16a34a"
            />
            <circle cx="14" cy="14" r="6" fill="white" />
          </svg>
        </div>
      )}
    </div>
  );
}
