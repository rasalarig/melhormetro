"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ManualFilters {
  types: string[];
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_parking: number | null;
  city: string;
  neighborhood: string;
  characteristics: string[];
  sort_by: string;
}

export function getEmptyManualFilters(): ManualFilters {
  return {
    types: [],
    min_price: null,
    max_price: null,
    min_area: null,
    max_area: null,
    min_bedrooms: null,
    min_bathrooms: null,
    min_parking: null,
    city: "",
    neighborhood: "",
    characteristics: [],
    sort_by: "relevance",
  };
}

export function countActiveFilters(f: ManualFilters): number {
  let count = 0;
  if (f.types.length > 0) count++;
  if (f.min_price !== null || f.max_price !== null) count++;
  if (f.min_area !== null || f.max_area !== null) count++;
  if (f.min_bedrooms !== null) count++;
  if (f.min_bathrooms !== null) count++;
  if (f.min_parking !== null) count++;
  if (f.city.trim()) count++;
  if (f.neighborhood.trim()) count++;
  if (f.characteristics.length > 0) count++;
  if (f.sort_by !== "relevance") count++;
  return count;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "casa_condominio", label: "Casa em Condomínio" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
  { value: "terreno_condominio", label: "Terreno em Condomínio" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
];

const PRICE_RANGES = [
  { label: "Ate R$ 200mil", min: null, max: 200000 },
  { label: "R$ 200-500mil", min: 200000, max: 500000 },
  { label: "R$ 500mil-1M", min: 500000, max: 1000000 },
  { label: "Acima de R$ 1M", min: 1000000, max: null },
];

const CHARACTERISTICS_OPTIONS = [
  "Piscina",
  "Churrasqueira",
  "Condomínio fechado",
  "Segurança 24h",
  "Área gourmet",
  "Cozinha planejada",
  "Quintal",
  "Varanda",
  "Elevador",
  "Academia",
  "Playground",
  "Salão de festas",
  "Ar condicionado",
  "Energia solar",
  "Leve aclive",
  "Acentuado aclive",
  "Leve declive",
  "Acentuado declive",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "area_asc", label: "Menor área" },
  { value: "area_desc", label: "Maior área" },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface SearchFiltersPanelProps {
  filters: ManualFilters;
  onApply: (filters: ManualFilters) => void;
}

export function SearchFiltersPanel({
  filters,
  onApply,
}: SearchFiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ManualFilters>({ ...filters });

  // Sync draft when external filters change
  useEffect(() => {
    if (!open) {
      setDraft({ ...filters });
    }
  }, [filters, open]);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const handleApply = () => {
    onApply({ ...draft });
    setOpen(false);
  };

  const handleClear = () => {
    const empty = getEmptyManualFilters();
    setDraft(empty);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────

  const toggleType = (type: string) => {
    setDraft((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleCharacteristic = (char: string) => {
    setDraft((prev) => ({
      ...prev,
      characteristics: prev.characteristics.includes(char)
        ? prev.characteristics.filter((c) => c !== char)
        : [...prev.characteristics, char],
    }));
  };

  const setCounterValue = (
    field: "min_bedrooms" | "min_bathrooms" | "min_parking",
    value: number
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  };

  const applyPriceRange = (min: number | null, max: number | null) => {
    setDraft((prev) => {
      // Toggle off if same range is already selected
      if (prev.min_price === min && prev.max_price === max) {
        return { ...prev, min_price: null, max_price: null };
      }
      return { ...prev, min_price: min, max_price: max };
    });
  };

  const parsePriceInput = (val: string): number | null => {
    const num = parseInt(val.replace(/\D/g, ""), 10);
    return isNaN(num) ? null : num;
  };

  const formatPriceDisplay = (val: number | null): string => {
    if (val === null) return "";
    return val.toLocaleString("pt-BR");
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative gap-2 border-border/50 hover:border-emerald-500/50 hover:text-emerald-400 rounded-xl"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
        {activeCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500 text-white text-[10px] rounded-full">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Filter Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <SheetTitle className="text-lg font-semibold">
              Filtros Avançados
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Refine sua busca com filtros detalhados
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Tipo de Imóvel */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Tipo de Imóvel
              </h3>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      draft.types.includes(value)
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Faixa de Preço */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Faixa de Preço
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => applyPriceRange(range.min, range.max)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      draft.min_price === range.min &&
                      draft.max_price === range.max
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Mínimo (R$)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatPriceDisplay(draft.min_price)}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        min_price: parsePriceInput(e.target.value),
                      }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Máximo (R$)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Sem limite"
                    value={formatPriceDisplay(draft.max_price)}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        max_price: parsePriceInput(e.target.value),
                      }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </section>

            {/* Area */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Área (m2)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Mínimo
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={draft.min_area ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        min_area: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Sem limite"
                    value={draft.max_area ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        max_area: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </section>

            {/* Quartos */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Quartos
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCounterValue("min_bedrooms", n)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      draft.min_bedrooms === n
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                    }`}
                  >
                    {n === 5 ? "5+" : n}
                  </button>
                ))}
              </div>
            </section>

            {/* Banheiros */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Banheiros
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCounterValue("min_bathrooms", n)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      draft.min_bathrooms === n
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                    }`}
                  >
                    {n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </section>

            {/* Vagas de Garagem */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Vagas de garagem
              </h3>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCounterValue("min_parking", n)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                      draft.min_parking === n
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                    }`}
                  >
                    {n === 3 ? "3+" : n}
                  </button>
                ))}
              </div>
            </section>

            {/* Localização */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Localização
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Cidade
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Atibaia, Bragança Paulista..."
                    value={draft.city}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Bairro
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Jardim Paulista..."
                    value={draft.neighborhood}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        neighborhood: e.target.value,
                      }))
                    }
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </section>

            {/* Características */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Características
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {CHARACTERISTICS_OPTIONS.map((char) => (
                  <label
                    key={char}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        draft.characteristics.includes(char)
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-border/50 group-hover:border-emerald-500/30"
                      }`}
                    >
                      {draft.characteristics.includes(char) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        draft.characteristics.includes(char)
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {char}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Ordenação */}
            <section>
              <h3 className="text-sm font-medium mb-3 text-foreground">
                Ordenação
              </h3>
              <Select
                value={draft.sort_by}
                onValueChange={(val) =>
                  setDraft((prev) => ({ ...prev, sort_by: val }))
                }
              >
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Mais relevantes" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-border/50 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="flex-1 text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
