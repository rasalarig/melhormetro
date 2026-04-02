"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";

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
  mode: "openai" | "claude" | "ai" | "local" | "empty" | "error";
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

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setSearchMode(data.mode);
    } catch {
      setResults([]);
      setSearchMode("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`, {
        scroll: false,
      });
      doSearch(query.trim());
    }
  };

  const suggestions = [
    "terreno plano em condominio",
    "com arvores frutiferas",
    "vista para serra",
    "ate R$ 150.000",
    "terreno grande acima de 400m2",
    "seguro para criancas",
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
          Voltar ao inicio
        </Link>

        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Busca <span className="text-emerald-400">Inteligente</span>
          </h1>
          <p className="text-muted-foreground">
            Descreva o imovel ideal em suas proprias palavras
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex items-center bg-card border border-border rounded-2xl overflow-hidden">
              <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Descreva o imovel que voce procura..."
                className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground/60"
              />
              <Button
                type="submit"
                disabled={loading}
                className="m-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-6"
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
        </form>

        {/* Suggestion chips */}
        {!searched && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <span className="text-xs text-muted-foreground">Sugestoes:</span>
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
                ) : searchMode === "claude" || searchMode === "ai" ? (
                  <>
                    <Brain className="w-3 h-3" /> Busca por Claude
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
                  Tente descrever de outra forma ou use termos mais gerais.
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
