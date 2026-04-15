"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("@/components/property-map"), { ssr: false });

interface CondominioMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export default function CondominioMap({ lat, lng, name, address }: CondominioMapProps) {
  return (
    <PropertyMap
      latitude={lat}
      longitude={lng}
      title={name}
      address={address}
    />
  );
}
