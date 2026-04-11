"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Maximize, Play } from "lucide-react";
import { isVideoUrl, resolveMediaUrl } from "@/lib/media-utils";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/like-button";
import { FavoritesCompareChat } from "@/components/favorites-compare-chat";

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface FavoriteProperty {
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
  characteristics: string;
  coverImage: string | null;
  images: PropertyImage[];
  likes_count: number;
}

const typeLabels: Record<string, string> = {
  terreno: "Terreno",
  casa: "Casa",
  apartamento: "Apartamento",
  comercial: "Comercial",
  rural: "Rural",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data = await res.json();
        setFavorites(data.favorites || []);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="pt-16 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Meus Favoritos</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl md:text-3xl font-bold">Meus Favoritos</h1>
          {favorites.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({favorites.length} {favorites.length === 1 ? "imóvel" : "imóveis"})
            </span>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2 text-muted-foreground">
              Você ainda não curtiu nenhum imóvel.
            </h2>
            <p className="text-muted-foreground mb-6">
              Explore os Reels e curta os imóveis que mais gostar!
            </p>
            <Link
              href="/reels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Explorar Reels
            </Link>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <div
                key={property.id}
                className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                {/* Image */}
                <Link href={`/imoveis/${property.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-900/30 to-teal-900/30">
                    {property.coverImage && isVideoUrl(resolveMediaUrl(property.coverImage)) ? (
                      <div className="relative w-full h-full">
                        <video
                          src={resolveMediaUrl(property.coverImage)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      </div>
                    ) : property.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(property.coverImage)}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Maximize className="w-12 h-12 opacity-20 text-muted-foreground" />
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-500/90 text-white border-0 text-xs px-2.5 py-0.5">
                        {typeLabels[property.type] || property.type}
                      </Badge>
                    </div>

                    {/* Like button */}
                    <div className="absolute top-3 right-3">
                      <LikeButton propertyId={property.id} size="sm" />
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <Link href={`/imoveis/${property.id}`}>
                  <div className="p-4">
                    <p className="text-emerald-400 font-bold text-lg mb-1">
                      {formatPrice(property.price)}
                    </p>
                    <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {property.city}, {property.state} - {property.area} m&sup2;
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {favorites.length >= 2 && (
            <FavoritesCompareChat properties={favorites} />
          )}
          </>
        )}
      </div>
    </div>
  );
}
