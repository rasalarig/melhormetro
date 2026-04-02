import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Maximize } from "lucide-react";

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
}

export function PropertyCard({ id, title, price, area, city, state, type, characteristics, image }: PropertyCardProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const typeLabels: Record<string, string> = {
    terreno: "Terreno",
    casa: "Casa",
    apartamento: "Apartamento",
    comercial: "Comercial",
    rural: "Rural",
  };

  return (
    <Link href={`/imoveis/${id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
        <div className="relative h-48 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Maximize className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-emerald-500/90 text-white border-0 text-xs">
              {typeLabels[type] || type}
            </Badge>
          </div>
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
            <span className="text-xs text-muted-foreground">
              {area}m&sup2;
            </span>
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
