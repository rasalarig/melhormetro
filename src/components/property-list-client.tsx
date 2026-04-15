"use client";

import { useState, useMemo } from "react";
import { PropertyCard } from "./property-card";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, ArrowUpDown, Search } from "lucide-react";
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
  characteristics: string;
  created_at: string;
  coverImage?: string;
  allow_resale?: boolean;
  resale_commission_percent?: number | null;
}

type SortOption = "recent" | "price_asc" | "price_desc" | "area_asc" | "area_desc";

interface PropertyListClientProps {
  properties: Property[];
}

export function PropertyListClient({ properties }: PropertyListClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sortedProperties = useMemo(() => {
    const sorted = [...properties];
    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "area_asc":
        return sorted.sort((a, b) => a.area - b.area);
      case "area_desc":
        return sorted.sort((a, b) => b.area - a.area);
      default:
        return sorted;
    }
  }, [properties, sortBy]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recent", label: "Mais Recentes" },
    { value: "price_asc", label: "Menor Preço" },
    { value: "price_desc", label: "Maior Preço" },
    { value: "area_asc", label: "Menor Área" },
    { value: "area_desc", label: "Maior Área" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Imóveis Disponíveis</h1>
          <p className="text-muted-foreground mt-1">
            {properties.length} {properties.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/busca">
            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Busca IA
            </Button>
          </Link>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Property Grid/List */}
      {sortedProperties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Nenhum imóvel disponível no momento.</p>
          <Link href="/admin/cadastro">
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">Cadastrar Imóvel</Button>
          </Link>
        </div>
      ) : (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "flex flex-col gap-4"
        }>
          {sortedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              price={property.price}
              area={property.area}
              city={property.city}
              state={property.state}
              type={property.type}
              characteristics={JSON.parse(property.characteristics || "[]")}
              image={property.coverImage}
              allow_resale={property.allow_resale}
              resale_commission_percent={property.resale_commission_percent}
              neighborhood={property.neighborhood}
              description={property.description}
            />
          ))}
        </div>
      )}
    </>
  );
}
