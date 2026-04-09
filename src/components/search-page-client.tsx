"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  Loader2,
  Brain,
  Cpu,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import {
  SearchFiltersPanel,
  type ManualFilters,
  getEmptyManualFilters,
  countActiveFilters,
} from "@/components/search-filters-panel";

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
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: "openai" | "claude" | "ai" | "ai_filters" | "local" | "filters" | "empty" | "error";
  total: number;
}

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

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

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
          // Use POST when we have manual filters
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
          // Simple GET for text-only search
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

  const handleApplyFilters = (newFilters: ManualFilters) => {
    setFilters(newFilters);
    // Trigger a search with the new filters
    doSearch(query.trim(), newFilters);
  };

  const suggestions = [
    "terreno plano em condomínio",
    "com árvores frutíferas",
    "vista para serra",
    "até R$ 150.000",
    "terreno grande acima de 400m²",
    "seguro para crianças",
  ];

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Busca <span className="text-emerald-400">Inteligente</span>
          </h1>
          <p className="text-muted-foreground">
            Descreva o imóvel ideal em suas próprias palavras
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-start">
                <Search className="w-5 h-5 text-muted-foreground ml-4 mt-4 shrink-0" />
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="Descreva o imóvel que você procura..."
                  rows={3}
                  className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground/60 resize-none"
                />
              </div>
              <div className="flex items-center justify-between px-2 pb-2 gap-2">
                <div className="pl-2">
                  <SearchFiltersPanel
                    filters={filters}
                    onApply={handleApplyFilters}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-6"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Active filters summary */}
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
                {filters.characteristics.length} característica{filters.characteristics.length > 1 ? "s" : ""}
              </Badge>
            )}
            <button
              onClick={() => {
                const empty = getEmptyManualFilters();
                setFilters(empty);
                if (query.trim()) {
                  doSearch(query.trim(), empty);
                } else {
                  setResults([]);
                  setSearched(false);
                }
              }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors underline"
            >
              Limpar todos
            </button>
          </div>
        )}

        {/* Suggestion chips */}
        {!searched && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <span className="text-xs text-muted-foreground">Sugestões:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  router.push(`/busca?q=${encodeURIComponent(s)}`, {
                    scroll: false,
                  });
                  doSearch(s);
                }}
                className="text-xs px-3 py-1 rounded-full border border-border hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-muted-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-muted-foreground">Analisando sua busca...</p>
          </div>
        )}

        {!loading && searched && (
          <>
            {/* Search mode indicator */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {results.length}{" "}
                {results.length === 1
                  ? "resultado encontrado"
                  : "resultados encontrados"}
              </p>
              <Badge variant="secondary" className="text-xs gap-1">
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
                  Tente descrever de outra forma ou ajuste os filtros.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        doSearch(s);
                      }}
                      className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
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
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-emerald-500/30 transition-all">
                      {/* Property info */}
                      <div className="flex-1">
                        <Link href={`/imoveis/${result.id}`}>
                          <h3 className="font-semibold text-lg mb-1 group-hover:text-emerald-400 transition-colors">
                            {result.title}
                          </h3>
                        </Link>
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
                      <div className="flex flex-col items-end justify-between">
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
                        <Link href={`/imoveis/${result.id}`}>
                          <Button
                            size="sm"
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          >
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
