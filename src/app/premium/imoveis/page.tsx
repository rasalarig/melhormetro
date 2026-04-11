"use client";

import { useState, useEffect } from "react";
import { Loader2, Crown, MapPin, Maximize, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  coverImage?: string;
  created_at: string;
}

export default function PremiumImoveisPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/premium/properties");
        if (res.ok) {
          const data = await res.json();
          setProperties(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-amber-100">
              Imóveis Premium
            </h1>
          </div>
          <p className="text-amber-100/40">
            {properties.length} {properties.length === 1 ? "imóvel selecionado" : "imóveis selecionados"}
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-20">
            <Crown className="w-16 h-16 text-amber-500/30 mx-auto mb-4" />
            <p className="text-amber-100/40 text-lg mb-6">
              Nenhum imóvel premium disponível no momento.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300"
            >
              <ArrowRight className="w-4 h-4" />
              Voltar ao Premium
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link key={property.id} href={`/imoveis/${property.id}`}>
                <div className="group rounded-2xl border border-amber-500/10 bg-[hsl(220,20%,7%)]/80 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
                  {/* Image */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-[hsl(220,20%,10%)]">
                    {property.coverImage ? (
                      <img
                        src={property.coverImage.startsWith("http") ? property.coverImage : `/uploads/${property.coverImage}`}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Crown className="w-12 h-12 text-amber-500/20" />
                      </div>
                    )}
                    {/* Premium badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-xs font-bold">
                      PREMIUM
                    </div>
                    {/* Price overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xl font-bold text-amber-400">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-amber-100 mb-2 line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-amber-100/40">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {property.city}, {property.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" />
                        {property.area}m²
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
