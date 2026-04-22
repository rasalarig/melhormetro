"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Search, Trees, Dumbbell, Waves, Shield, Music, Swords, Baby, ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface Condominium {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  amenities: string[] | null;
  lat: number | null;
  lng: number | null;
  cover_image_url: string | null;
  property_count: string;
  min_price: number | null;
  max_price: number | null;
}

const AMENITY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  piscina: { icon: Waves, label: "Piscina" },
  academia: { icon: Dumbbell, label: "Academia" },
  playground: { icon: Baby, label: "Playground" },
  "portaria 24h": { icon: Shield, label: "Portaria 24h" },
  portaria: { icon: Shield, label: "Portaria" },
  quadra: { icon: Swords, label: "Quadra" },
  "salão de festas": { icon: Music, label: "Salão de Festas" },
  "área verde": { icon: Trees, label: "Área Verde" },
};

export default function CondominiosPage() {
  const { user } = useAuth();
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/condominiums")
      .then((r) => r.json())
      .then((data) => {
        setCondominiums(data.condominiums || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  const filtered = condominiums.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q) ||
      (c.neighborhood || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Condomínios</h1>
            <p className="text-muted-foreground">
              Explore os condomínios disponíveis e veja os imóveis em cada um
            </p>
          </div>
          {user && (
            <Link href="/admin/condominios">
              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex-shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Cadastrar
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade ou bairro..."
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum condomínio encontrado</p>
            {search ? (
              <p className="text-sm mt-1">Tente buscar por outro nome ou cidade</p>
            ) : user ? (
              <div className="mt-4">
                <p className="text-sm mb-3">Seja o primeiro a cadastrar um condomínio!</p>
                <Link href="/admin/condominios">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Cadastrar Condomínio
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((condo) => {
              const count = parseInt(condo.property_count, 10);
              return (
                <Link key={condo.id} href={`/condominios/${condo.slug}`}>
                  <Card className="group overflow-hidden border-border/50 bg-card hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 h-full">
                    {/* Cover image */}
                    <div className="relative h-44 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 overflow-hidden">
                      {condo.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={condo.cover_image_url}
                          alt={condo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-emerald-500/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">
                          {condo.name}
                        </h2>
                        {(condo.city || condo.state) && (
                          <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[condo.neighborhood, condo.city, condo.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Description */}
                      {condo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {condo.description}
                        </p>
                      )}

                      {/* Amenity icons */}
                      {condo.amenities && condo.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {condo.amenities.slice(0, 5).map((amenity) => {
                            const icon = AMENITY_ICONS[amenity.toLowerCase()];
                            if (icon) {
                              const Icon = icon.icon;
                              return (
                                <span
                                  key={amenity}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                >
                                  <Icon className="w-3 h-3" />
                                  {icon.label}
                                </span>
                              );
                            }
                            return (
                              <Badge
                                key={amenity}
                                variant="secondary"
                                className="text-xs bg-secondary/80"
                              >
                                {amenity}
                              </Badge>
                            );
                          })}
                          {condo.amenities.length > 5 && (
                            <Badge variant="secondary" className="text-xs bg-secondary/80">
                              +{condo.amenities.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            <span className="font-semibold text-emerald-400">{count}</span>
                            <span className="text-muted-foreground ml-1">
                              {count === 1 ? "imóvel disponível" : "imóveis disponíveis"}
                            </span>
                          </span>
                        </div>
                        {condo.min_price != null && (
                          <span className="text-xs text-muted-foreground">
                            a partir de {formatPrice(condo.min_price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end text-emerald-400 text-xs font-medium group-hover:gap-2 gap-1 transition-all">
                        Ver imóveis
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
