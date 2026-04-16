"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Home, Building2, Mountain, Store, Trees, Shield, Bot, Video, Phone, CheckCircle, ArrowRight, Loader2, Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property-card";
import { useAuth } from "@/components/auth-provider";

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface Property {
  id: number;
  title: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  characteristics: string[];
  images: PropertyImage[];
  allow_resale?: boolean;
  resale_commission_percent?: number | null;
}

const CATEGORIES = [
  { label: "Casas", type: "casa", icon: Home },
  { label: "Apartamentos", type: "apartamento", icon: Building2 },
  { label: "Terrenos", type: "terreno", icon: Mountain },
  { label: "Comercial", type: "comercial", icon: Store },
  { label: "Rural", type: "rural", icon: Trees },
  { label: "Condomínios", type: "casa_condominio", icon: Shield },
];

const HIGHLIGHTS = [
  {
    icon: Bot,
    title: "Busca com IA",
    description: "Descreva o que procura e a IA encontra para você",
    color: "from-emerald-500/20 to-teal-600/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Video,
    title: "Tours em Vídeo",
    description: "Conheça imóveis sem sair de casa com nossos tours em vídeo",
    color: "from-teal-500/20 to-cyan-600/20",
    iconColor: "text-teal-400",
  },
  {
    icon: Phone,
    title: "Contato Direto",
    description: "Fale diretamente com vendedores, sem intermediários",
    color: "from-cyan-500/20 to-sky-600/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: CheckCircle,
    title: "Imóveis Verificados",
    description: "Todos os anúncios são moderados antes de publicar",
    color: "from-green-500/20 to-emerald-600/20",
    iconColor: "text-green-400",
  },
];

function getImageUrl(images: PropertyImage[]): string | undefined {
  if (!images || images.length === 0) return undefined;
  const cover = images.find((img) => img.is_cover === 1) ?? images[0];
  return cover.filename;
}

const HERO_SUGGESTIONS = [
  { label: "Casa com vista", query: "Casa com vista para mata e piscina" },
  { label: "Terreno no interior", query: "Terreno em condominio fechado no interior" },
  { label: "Apto em SP", query: "Apartamento perto do metro em SP" },
  { label: "Campo com cavalos", query: "Casa de campo com espaco para cavalos" },
];

export function HomepageHero() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroQuery.trim();
    if (trimmed) {
      router.push(`/busca?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/busca");
    }
  };

  const handleHeroSuggestion = (query: string) => {
    router.push(`/busca?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-emerald-950/30 to-background py-16 md:py-24">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
          <Bot className="w-4 h-4" />
          Busca inteligente com IA
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
          Encontre o imóvel{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            dos seus sonhos
          </span>
        </h1>

        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Descreva o que você deseja em linguagem natural e a IA encontra para você.
        </p>

        {/* Mini lifestyle search input */}
        <form
          onSubmit={handleHeroSearch}
          className="max-w-2xl mx-auto mb-4"
        >
          <div className="relative flex items-center rounded-2xl border border-emerald-500/30 bg-card shadow-xl shadow-emerald-500/10 focus-within:border-emerald-500/60 transition-all duration-200">
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder="Descreva o imovel dos seus sonhos..."
              className="flex-1 bg-transparent rounded-l-2xl px-5 py-4 text-sm md:text-base outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              className="shrink-0 m-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </form>

        {/* Lifestyle suggestion pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {HERO_SUGGESTIONS.map(({ label, query }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleHeroSuggestion(query)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300 text-xs text-muted-foreground transition-all duration-150 backdrop-blur-sm"
            >
              <Sparkles className="w-3 h-3 text-emerald-500/60" />
              {label}
            </button>
          ))}
        </div>

        {!loading && !user && (
          <div className="flex justify-center">
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 px-8"
              >
                Cadastre-se grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function HomepageCategories() {
  return (
    <section className="py-8 border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {CATEGORIES.map(({ label, type, icon: Icon }) => (
            <Link
              key={type}
              href={`/busca?type=${type}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-300 text-sm font-medium transition-all duration-200"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomepageHighlights() {
  return (
    <section className="py-14 md:py-18">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Por que o MelhorMetro?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
            Uma plataforma moderna pensada para comprador e vendedor
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, description, color, iconColor }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col gap-4 hover:border-emerald-500/30 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomepageFeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/properties", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          // Show up to 6 featured properties
          setProperties(data.slice(0, 6));
        }
      } catch {
        // silent fail — section just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  if (loading) {
    return (
      <section className="py-14">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      </section>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section className="py-14 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Imóveis em destaque
            </h2>
            <p className="text-muted-foreground text-sm">Os imóveis mais recentes na plataforma</p>
          </div>
          <Link
            href="/busca"
            className="hidden sm:inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              price={property.price}
              area={property.area}
              city={property.city}
              state={property.state}
              type={property.type}
              characteristics={property.characteristics}
              image={getImageUrl(property.images)}
              allow_resale={property.allow_resale}
              resale_commission_percent={property.resale_commission_percent}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/busca">
            <Button
              variant="outline"
              className="border-border/50 hover:border-emerald-500/40 hover:text-emerald-300"
            >
              Ver todos os imóveis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/tours">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-emerald-300"
            >
              <Film className="w-4 h-4 mr-2" />
              Ver tours em vídeo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
