"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const suggestions = [
    "terreno plano em condomínio fechado",
    "terreno com árvores frutíferas",
    "imóvel com vista para serra",
    "terreno próximo a escola",
  ];

  return (
    <section className="relative pt-20 pb-20 px-4 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Busca por Inteligência Artificial
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          Encontre o imóvel ideal
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            do seu jeito
          </span>
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Descreva o que você procura em linguagem natural. Nossa IA entende características que filtros tradicionais não alcançam.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex items-center bg-card border border-border rounded-2xl overflow-hidden">
              <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: terreno plano com árvores em condomínio fechado..."
                className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground/60"
              />
              <Button
                type="submit"
                className="m-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </form>

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground">Experimente:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                router.push(`/busca?q=${encodeURIComponent(s)}`);
              }}
              className="text-xs px-3 py-1 rounded-full border border-border hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-muted-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
