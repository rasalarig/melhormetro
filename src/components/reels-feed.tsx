"use client";

import { useState, useEffect } from "react";
import { PropertyReel } from "@/components/property-reel";
import { Loader2 } from "lucide-react";

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  characteristics: string[];
  images: PropertyImage[];
}

export function ReelsFeed() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch("/api/reels");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProperties(data);
      } catch {
        setError("Erro ao carregar imóveis");
      } finally {
        setLoading(false);
      }
    }

    fetchReels();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-black"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/60 text-sm">Carregando reels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-black"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-black"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <div className="text-center">
          <p className="text-white/60 text-lg mb-2">
            Nenhum imóvel disponível
          </p>
          <p className="text-white/40 text-sm">
            Volte mais tarde para ver novos imóveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="reels-container overflow-y-scroll bg-black"
      style={{
        height: "calc(100vh - 4rem)",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
      }}
    >
      {properties.map((property) => (
        <div
          key={property.id}
          style={{
            height: "calc(100vh - 4rem)",
            scrollSnapAlign: "start",
          }}
        >
          <PropertyReel
            id={property.id}
            title={property.title}
            description={property.description}
            price={property.price}
            area={property.area}
            type={property.type}
            city={property.city}
            state={property.state}
            characteristics={property.characteristics}
            images={property.images}
          />
        </div>
      ))}
    </div>
  );
}
