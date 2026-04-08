"use client";

import { useState, useEffect } from "react";
import { PropertyReel } from "@/components/property-reel";
import { Loader2, Home, Search, PlusCircle } from "lucide-react";
import Link from "next/link";

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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/reels", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProperties(data);
        }
      } catch {
        // On error/timeout, just show empty state
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
        style={{ height: "100dvh" }}
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
        style={{ height: "100dvh" }}
      >
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-900 to-black"
        style={{ height: "100dvh" }}
      >
        <div className="text-center px-6 max-w-md">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
            <Home className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Nenhum imóvel cadastrado ainda
          </h1>
          <p className="text-white/50 text-sm mb-8">
            Seja o primeiro a cadastrar! Publique seu imóvel e alcance milhares de pessoas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/vender/imovel"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Imóvel
            </Link>
            <Link
              href="/imoveis"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium transition-all"
            >
              <Search className="w-4 h-4" />
              Explorar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black flex items-center justify-center overflow-hidden">
      {/* Phone-shaped wrapper on desktop, fullscreen on mobile */}
      <div
        className="relative w-full h-full md:h-full md:aspect-[9/16] md:max-w-[calc(100dvh*9/16)] md:rounded-3xl md:border md:border-white/10 md:shadow-2xl md:overflow-hidden"
      >
        <div
          className="reels-container scrollbar-hide overflow-y-scroll h-full w-full"
          style={{
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
          }}
        >
          {properties.map((property) => (
            <div
              key={property.id}
              className="h-full w-full"
              style={{ scrollSnapAlign: "start" }}
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
      </div>
    </div>
  );
}
