"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  title?: string;
  address?: string;
}

export default function PropertyMap({
  latitude,
  longitude,
  title,
  address,
}: PropertyMapProps) {
  if (!latitude || !longitude) {
    return (
      <div className="h-64 rounded-xl border border-border/50 bg-card flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Localizacao nao disponivel</p>
      </div>
    );
  }

  return (
    <div className="h-64 rounded-xl border border-border/50 overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          {(title || address) && (
            <Popup>
              {title && <strong>{title}</strong>}
              {address && <p className="text-xs mt-1">{address}</p>}
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
