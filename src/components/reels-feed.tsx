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
  // Tour fields
  tour_id?: number;
  tour_title?: string;
  tour_description?: string;
  is_original?: boolean;
}

export function ReelsFeed() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReels() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch("/api/reels", { signal: controller.signal, cache: "no-store" });
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

  // Empty / loading / error states — normal page flow (navbar visible)
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0 || error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
            <Home className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Bem-vindo ao MelhorMetro
          </h1>
          <p className="text-muted-foreground text-base mb-10 leading-relaxed">
            A plataforma inteligente para comprar e vender imóveis.<br />
            Cadastre seu primeiro imóvel e comece a receber contatos!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vender/imovel"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-base transition-all shadow-lg shadow-emerald-500/25"
            >
              <PlusCircle className="w-5 h-5" />
              Cadastrar Imóvel
            </Link>
            <Link
              href="/imoveis"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border/50 hover:border-border text-muted-foreground hover:text-foreground font-medium text-base transition-all"
            >
              <Search className="w-5 h-5" />
              Explorar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reels mode — fullscreen fixed overlay when there ARE properties
  return (
    <div className="fixed inset-0 top-14 bg-black z-40">
      <div className="h-full bg-black flex items-center justify-center overflow-hidden">
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
                  tourTitle={property.tour_title}
                  tourId={property.tour_id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
