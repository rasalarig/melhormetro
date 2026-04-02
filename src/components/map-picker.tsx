"use client";

import { useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

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

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { lat: number | null; lng: number | null }) => void;
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
}: MapPickerProps) {
  const [lat, setLat] = useState<string>(latitude?.toString() || "");
  const [lng, setLng] = useState<string>(longitude?.toString() || "");

  const handleMapClick = useCallback(
    (newLat: number, newLng: number) => {
      const roundedLat = Math.round(newLat * 10000) / 10000;
      const roundedLng = Math.round(newLng * 10000) / 10000;
      setLat(roundedLat.toString());
      setLng(roundedLng.toString());
      onChange({ lat: roundedLat, lng: roundedLng });
    },
    [onChange]
  );

  const handleManualChange = (field: "lat" | "lng", value: string) => {
    if (field === "lat") {
      setLat(value);
    } else {
      setLng(value);
    }
    const numLat = field === "lat" ? parseFloat(value) : parseFloat(lat);
    const numLng = field === "lng" ? parseFloat(value) : parseFloat(lng);
    onChange({
      lat: isNaN(numLat) ? null : numLat,
      lng: isNaN(numLng) ? null : numLng,
    });
  };

  const center: [number, number] = [
    latitude || -23.5,
    longitude || -48.0,
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span>Clique no mapa para marcar a localizacao do imovel</span>
      </div>

      <div className="h-64 rounded-xl border border-border/50 overflow-hidden">
        <MapContainer
          center={center}
          zoom={latitude && longitude ? 15 : 8}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Latitude
          </label>
          <Input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => handleManualChange("lat", e.target.value)}
            placeholder="-23.5920"
            className="bg-secondary/50 border-border/50 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Longitude
          </label>
          <Input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => handleManualChange("lng", e.target.value)}
            placeholder="-48.0530"
            className="bg-secondary/50 border-border/50 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
