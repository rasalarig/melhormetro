"use client";

import { useState, useEffect } from "react";
import { PropertyReel } from "@/components/property-reel";
import { Loader2, Crown, ArrowRight } from "lucide-react";
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

export default function PremiumReelsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReels() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/premium/reels", { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProperties(data);
        }
      } catch {
        // On error/timeout, show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-amber-100/40 text-sm">Carregando imóveis premium...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center">
            <Crown className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-amber-100 mb-3">
            Portfólio Premium
          </h1>
          <p className="text-amber-100/40 text-base mb-10 leading-relaxed">
            Em breve, imóveis selecionados exclusivamente para você estarão disponíveis aqui.
          </p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold transition-all shadow-lg shadow-amber-500/20"
          >
            <ArrowRight className="w-5 h-5" />
            Voltar ao Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-40">
      <div className="h-full bg-black flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full md:h-full md:aspect-[9/16] md:max-w-[calc(100dvh*9/16)] md:rounded-3xl md:border md:border-amber-500/20 md:shadow-2xl md:overflow-hidden">
          <div
            className="reels-container scrollbar-hide overflow-y-scroll h-full w-full"
            style={{ scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
          >
            {properties.map((property) => (
              <div key={property.id} className="h-full w-full" style={{ scrollSnapAlign: "start" }}>
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
    </div>
  );
}
