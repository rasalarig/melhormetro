"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Sparkles,
  Loader2,
  Brain,
  Cpu,
  ArrowLeft,
  SlidersHorizontal,
  ChevronDown,
  Maximize,
  X,
} from "lucide-react";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media-utils";
import {
  type ManualFilters,
  getEmptyManualFilters,
  countActiveFilters,
} from "@/components/search-filters-panel";

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "terreno", label: "Terreno" },
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
  "Condominio fechado",
  "Seguranca 24h",
  "Area gourmet",
  "Cozinha planejada",
  "Quintal",
  "Varanda",
  "Elevador",
  "Academia",
  "Playground",
  "Salao de festas",
  "Ar condicionado",
  "Energia solar",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" },
  { value: "area_asc", label: "Menor area" },
  { value: "area_desc", label: "Maior area" },
];

const LIFESTYLE_SUGGESTIONS = [
  "Casa com vista para mata e piscina",
  "Apartamento perto do metro em SP",
  "Terreno em condominio fechado no interior",
  "Casa de campo com espaco para cavalos",
  "Apartamento compacto para investimento",
  "Imovel comercial em avenida movimentada",
];

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string | null;
  characteristics: string[];
  score: number;
  matchReasons: string[];
  cover_image: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: "openai" | "claude" | "ai" | "ai_filters" | "local" | "filters" | "empty" | "error";
  total: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const parsePriceInput = (val: string): number | null => {
  const num = parseInt(val.replace(/\D/g, ""), 10);
  return isNaN(num) ? null : num;
};

const formatPriceDisplay = (val: number | null): string => {
  if (val === null) return "";
  return val.toLocaleString("pt-BR");
};

// ── Component ────────────────────────────────────────────────────────────────

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<string>("");
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState<ManualFilters>(getEmptyManualFilters());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // ── Search logic ───────────────────────────────────────────────────────

  const doSearch = useCallback(
    async (searchQuery: string, manualFilters?: ManualFilters) => {
      const filtersToUse = manualFilters || filters;
      const hasFilters = countActiveFilters(filtersToUse) > 0;
      const hasQuery = searchQuery.trim().length > 0;

      if (!hasQuery && !hasFilters) return;

      setLoading(true);
      setSearched(true);

      try {
        let data: SearchResponse;

        if (hasFilters) {
          const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: searchQuery,
              filters: {
                types: filtersToUse.types,
                min_price: filtersToUse.min_price,
                max_price: filtersToUse.max_price,
                min_area: filtersToUse.min_area,
                max_area: filtersToUse.max_area,
                min_bedrooms: filtersToUse.min_bedrooms,
                min_bathrooms: filtersToUse.min_bathrooms,
                min_parking: filtersToUse.min_parking,
                city: filtersToUse.city,
                neighborhood: filtersToUse.neighborhood,
                characteristics: filtersToUse.characteristics,
                sort_by: filtersToUse.sort_by,
              },
            }),
          });
          data = await res.json();
        } else {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(searchQuery)}`
          );
          data = await res.json();
        }

        setResults(data.results);
        setSearchMode(data.mode);
      } catch {
        setResults([]);
        setSearchMode("error");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed || countActiveFilters(filters) > 0) {
      if (trimmed) {
        router.push(`/busca?q=${encodeURIComponent(trimmed)}`, {
          scroll: false,
        });
      }
      doSearch(trimmed);
    }
  };

  const handleFilterSearch = () => {
    const trimmed = query.trim();
    if (trimmed || countActiveFilters(filters) > 0) {
      if (trimmed) {
        router.push(`/busca?q=${encodeURIComponent(trimmed)}`, {
          scroll: false,
        });
      }
      doSearch(trimmed);
    }
  };

  const handleClearFilters = () => {
    const empty = getEmptyManualFilters();
    setFilters(empty);
    if (query.trim()) {
      doSearch(query.trim(), empty);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/busca?q=${encodeURIComponent(suggestion)}`, { scroll: false });
    doSearch(suggestion);
    textareaRef.current?.focus();
  };

  // ── Filter helpers ─────────────────────────────────────────────────────

  const toggleType = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleCharacteristic = (char: string) => {
    setFilters((prev) => ({
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
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  };

  const applyPriceRange = (min: number | null, max: number | null) => {
    setFilters((prev) => {
      if (prev.min_price === min && prev.max_price === max) {
        return { ...prev, min_price: null, max_price: null };
      }
      return { ...prev, min_price: min, max_price: max };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao inicio
        </Link>

        {/* ── Lifestyle Hero Search ─────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mb-5">
          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              Encontre o imovel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                ideal para voce
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Descreva o que voce deseja em linguagem natural e a IA encontra para voce
            </p>
          </div>

          {/* Main search form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative rounded-2xl border border-emerald-500/30 bg-card shadow-lg shadow-emerald-500/5 focus-within:border-emerald-500/60 focus-within:shadow-emerald-500/10 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Descreva o imovel dos seus sonhos..."
                rows={3}
                className="w-full bg-transparent rounded-2xl px-5 py-4 pr-16 text-sm md:text-base outline-none placeholder:text-muted-foreground/50 resize-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-3 right-14 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (!query.trim() && activeFilterCount === 0)}
                className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

        </div>

        {/* ── Advanced Filters (collapsible) ────────────────────────────── */}
        <div className="max-w-3xl mx-auto mb-5">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 bg-card hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              Filtros avancados
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAdvancedFilters && (
            <div className="mt-2 p-6 rounded-xl border border-border/50 bg-card space-y-6">
              {/* Tipo de Imovel */}
              <section>
                <h3 className="text-sm font-medium mb-3 text-foreground">
                  Tipo de Imovel
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleType(value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        filters.types.includes(value)
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Faixa de Preco */}
              <section>
                <h3 className="text-sm font-medium mb-3 text-foreground">
                  Faixa de Preco
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() => applyPriceRange(range.min, range.max)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        filters.min_price === range.min &&
                        filters.max_price === range.max
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
                      Minimo (R$)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatPriceDisplay(filters.min_price)}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          min_price: parsePriceInput(e.target.value),
                        }))
                      }
                      className="bg-background border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Maximo (R$)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Sem limite"
                      value={formatPriceDisplay(filters.max_price)}
                      onChange={(e) =>
                        setFilters((prev) => ({
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
                  Area (m2)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Minimo
                    </label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={filters.min_area ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          min_area: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="bg-background border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Maximo
                    </label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Sem limite"
                      value={filters.max_area ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          max_area: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="bg-background border-border/50"
                    />
                  </div>
                </div>
              </section>

              {/* Quartos, Banheiros, Vagas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          filters.min_bedrooms === n
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                        }`}
                      >
                        {n === 5 ? "5+" : n}
                      </button>
                    ))}
                  </div>
                </section>

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
                          filters.min_bathrooms === n
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                        }`}
                      >
                        {n === 4 ? "4+" : n}
                      </button>
                    ))}
                  </div>
                </section>

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
                          filters.min_parking === n
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "border-border/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                        }`}
                      >
                        {n === 3 ? "3+" : n}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Localizacao */}
              <section>
                <h3 className="text-sm font-medium mb-3 text-foreground">
                  Localizacao
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Cidade
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Atibaia, Braganca Paulista..."
                      value={filters.city}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, city: e.target.value }))
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
                      value={filters.neighborhood}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          neighborhood: e.target.value,
                        }))
                      }
                      className="bg-background border-border/50"
                    />
                  </div>
                </div>
              </section>

              {/* Caracteristicas */}
              <section>
                <h3 className="text-sm font-medium mb-3 text-foreground">
                  Caracteristicas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CHARACTERISTICS_OPTIONS.map((char) => (
                    <label
                      key={char}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <div
                        onClick={() => toggleCharacteristic(char)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          filters.characteristics.includes(char)
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-border/50 group-hover:border-emerald-500/30"
                        }`}
                      >
                        {filters.characteristics.includes(char) && (
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
                          filters.characteristics.includes(char)
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

              {/* Ordenacao */}
              <section>
                <h3 className="text-sm font-medium mb-3 text-foreground">
                  Ordenacao
                </h3>
                <Select
                  value={filters.sort_by}
                  onValueChange={(val) =>
                    setFilters((prev) => ({ ...prev, sort_by: val }))
                  }
                >
                  <SelectTrigger className="bg-background border-border/50 max-w-xs">
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

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleFilterSearch}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-8 py-3 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Buscar com filtros
                </Button>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm text-muted-foreground hover:text-red-400 transition-colors underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Active filters summary ───────────────────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-3xl mx-auto">
            <span className="text-xs text-muted-foreground">Filtros ativos:</span>
            {filters.types.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}
              </Badge>
            )}
            {(filters.min_price !== null || filters.max_price !== null) && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.min_price !== null && filters.max_price !== null
                  ? `R$ ${filters.min_price.toLocaleString("pt-BR")} - R$ ${filters.max_price.toLocaleString("pt-BR")}`
                  : filters.min_price !== null
                  ? `A partir de R$ ${filters.min_price.toLocaleString("pt-BR")}`
                  : `Ate R$ ${filters.max_price!.toLocaleString("pt-BR")}`}
              </Badge>
            )}
            {(filters.min_area !== null || filters.max_area !== null) && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.min_area !== null && filters.max_area !== null
                  ? `${filters.min_area} - ${filters.max_area} m2`
                  : filters.min_area !== null
                  ? `A partir de ${filters.min_area} m2`
                  : `Ate ${filters.max_area} m2`}
              </Badge>
            )}
            {filters.min_bedrooms !== null && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.min_bedrooms}+ quartos
              </Badge>
            )}
            {filters.min_bathrooms !== null && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.min_bathrooms}+ banheiros
              </Badge>
            )}
            {filters.min_parking !== null && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.min_parking}+ vagas
              </Badge>
            )}
            {filters.city && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.city}
              </Badge>
            )}
            {filters.neighborhood && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.neighborhood}
              </Badge>
            )}
            {filters.characteristics.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {filters.characteristics.length} caracteristica{filters.characteristics.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-muted-foreground">A IA esta analisando sua busca...</p>
          </div>
        )}

        {!loading && searched && (
          <>
            {/* Search mode indicator */}
            <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground">
                {results.length}{" "}
                {results.length === 1
                  ? "resultado encontrado"
                  : "resultados encontrados"}
                {query && (
                  <span className="ml-1">
                    para{" "}
                    <span className="text-foreground font-medium">
                      &ldquo;{query}&rdquo;
                    </span>
                  </span>
                )}
              </p>
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                {searchMode === "openai" ? (
                  <>
                    <Brain className="w-3 h-3" /> Busca por GPT
                  </>
                ) : searchMode === "claude" || searchMode === "ai" || searchMode === "ai_filters" ? (
                  <>
                    <Brain className="w-3 h-3" /> Busca por IA
                  </>
                ) : searchMode === "filters" ? (
                  <>
                    <SlidersHorizontal className="w-3 h-3" /> Filtros manuais
                  </>
                ) : (
                  <>
                    <Cpu className="w-3 h-3" /> Busca Inteligente
                  </>
                )}
              </Badge>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Tente descrever de forma diferente ou use os filtros avancados.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {LIFESTYLE_SUGGESTIONS.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      className="px-3 py-1.5 rounded-full border border-border/50 bg-card hover:border-emerald-500/40 hover:text-emerald-300 text-xs text-muted-foreground transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.id} className="group">
                    <Link href={`/imoveis/${result.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_220px] gap-0 rounded-xl border border-border/50 bg-card hover:border-emerald-500/30 transition-all overflow-hidden">
                        {/* Cover image */}
                        <div className="relative w-full md:w-40 h-40 md:h-auto shrink-0 bg-gradient-to-br from-emerald-900/40 to-teal-900/40">
                          {result.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(result.cover_image)}
                              alt={result.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              <Maximize className="w-12 h-12" />
                            </div>
                          )}
                        </div>

                        {/* Property info */}
                        <div className="flex-1 p-4">
                          <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-400 transition-colors">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {result.description}
                          </p>

                          {/* Match reasons */}
                          <div className="space-y-1">
                            {result.matchReasons.map((reason, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                <span className="text-emerald-300/80">
                                  {reason}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {result.characteristics.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price & details sidebar */}
                        <div className="flex flex-col items-end justify-between p-4 border-t md:border-t-0 md:border-l border-border/30">
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-400">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(result.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {result.area}m2 - {result.city}, {result.state}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 mt-3"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Empty state (not yet searched) ───────────────────────────── */}
        {!loading && !searched && (
          <div className="text-center py-12 text-muted-foreground/50">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Descreva o imovel dos seus sonhos acima para comecar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
