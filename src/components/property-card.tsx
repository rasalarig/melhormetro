import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Maximize, Play, Handshake } from "lucide-react";
import { isVideoUrl, resolveMediaUrl } from "@/lib/media-utils";
import { ValuationScoreBadge } from "@/components/valuation-score";
import { calculateValuationScore } from "@/lib/valuation-score";

interface PropertyCardProps {
  id: number;
  title: string;
  price: number;
  area: number;
  city: string;
  state: string;
  type: string;
  characteristics: string[];
  image?: string;
  allow_resale?: boolean;
  resale_commission_percent?: number | null;
  showCommission?: boolean;
  // Optional extra fields for valuation score
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  details?: string | null;
  condominium_id?: number | null;
  facade_orientation?: string | null;
}

export function PropertyCard({ id, title, price, area, city, state, type, characteristics, image, allow_resale, resale_commission_percent, showCommission, neighborhood, latitude, longitude, description, details, condominium_id, facade_orientation }: PropertyCardProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const valuationResult = calculateValuationScore({
    type,
    area,
    price,
    city,
    state,
    neighborhood,
    latitude,
    longitude,
    description,
    characteristics,
    details,
    condominium_id,
    facade_orientation,
    images: image ? [{ filename: image }] : [],
  });

  const typeLabels: Record<string, string> = {
    terreno: "Terreno",
    terreno_condominio: "Terreno em Condomínio",
    casa: "Casa",
    casa_condominio: "Casa em Condomínio",
    apartamento: "Apartamento",
    comercial: "Comercial",
    rural: "Rural",
  };

  return (
    <Link href={`/imoveis/${id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
          {image && isVideoUrl(resolveMediaUrl(image)) ? (
            <div className="relative w-full h-full">
              <video
                src={`${resolveMediaUrl(image)}#t=0.1`}
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
          ) : image ? (
            <div className="relative w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(image)}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ opacity: 0 }}
                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; (e.target as HTMLImageElement).style.transition = "opacity 0.3s ease-in"; }}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Maximize className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
            <Badge className="bg-emerald-500/90 text-white border-0 text-xs">
              {typeLabels[type] || type}
            </Badge>
            {allow_resale && (
              <Badge className="bg-teal-600/90 text-white border-0 text-xs flex items-center gap-1">
                <Handshake className="w-2.5 h-2.5" />
                Recomercializável
              </Badge>
            )}
          </div>
          {allow_resale && showCommission && resale_commission_percent != null && (
            <div className="absolute top-3 right-3 z-20">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow">
                {resale_commission_percent}% comissão
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3 h-3" />
            {city}, {state}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-bold text-lg">
              {formatPrice(price)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {area}m&sup2;
              </span>
              {valuationResult.score > 0 && (
                <ValuationScoreBadge result={valuationResult} />
              )}
            </div>
          </div>

          {characteristics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {characteristics.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {tag}
                </span>
              ))}
              {characteristics.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  +{characteristics.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
