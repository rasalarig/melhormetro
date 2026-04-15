import { notFound } from "next/navigation";
import Link from "next/link";
import { getOne, getAll } from "@/lib/db";
import { PropertyCard } from "@/components/property-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Building2, Trees, Dumbbell, Waves, Shield, Music, Baby, ArrowLeft, Home } from "lucide-react";
import CondominioMap from "./condo-map";

export const revalidate = 0;

interface Props {
  params: { slug: string };
}

interface AmenityDef {
  icon: React.ElementType;
  label: string;
}

const AMENITY_ICONS: Record<string, AmenityDef> = {
  piscina: { icon: Waves, label: "Piscina" },
  academia: { icon: Dumbbell, label: "Academia" },
  playground: { icon: Baby, label: "Playground" },
  "portaria 24h": { icon: Shield, label: "Portaria 24h" },
  portaria: { icon: Shield, label: "Portaria" },
  quadra: { icon: Home, label: "Quadra" },
  "salão de festas": { icon: Music, label: "Salão de Festas" },
  "área verde": { icon: Trees, label: "Área Verde" },
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CondoRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  amenities: string[] | null;
  lat: number | null;
  lng: number | null;
  cover_image_url: string | null;
}

interface PropertyRow {
  id: number;
  title: string;
  price: number;
  area: number;
  city: string;
  state: string;
  type: string;
  characteristics: string | string[];
  details: string | Record<string, unknown>;
  images: Array<{ filename: string }> | string;
  [key: string]: unknown;
}

export async function generateMetadata({ params }: Props) {
  const condo = await getOne("SELECT * FROM condominiums WHERE slug = $1", [params.slug]) as CondoRow | null;
  if (!condo) return {};
  return {
    title: `${condo.name} | Condomínios | MelhorMetro`,
    description: condo.description || `Imóveis disponíveis no ${condo.name}`,
  };
}

export default async function CondominioPage({ params }: Props) {
  const condo = await getOne("SELECT * FROM condominiums WHERE slug = $1", [params.slug]) as CondoRow | null;

  if (!condo) notFound();

  const rawProperties = await getAll(
    `SELECT p.*,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        ) ORDER BY pi.is_cover DESC, pi.id ASC)
        FROM property_images pi WHERE pi.property_id = p.id
      ), '[]'::json) as images
    FROM properties p
    WHERE p.condominium_id = $1
      AND p.status = 'active'
      AND p.approved = 'approved'
    ORDER BY p.created_at DESC`,
    [condo.id]
  ) as PropertyRow[];

  const properties: PropertyRow[] = rawProperties.map((p) => ({
    ...p,
    characteristics: p.characteristics ? JSON.parse(p.characteristics as string) : [],
    details: p.details ? JSON.parse(p.details as string) : {},
    images: typeof p.images === "string" ? JSON.parse(p.images) : (p.images || []),
  }));

  const prices = properties.map((p) => p.price).filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const amenities: string[] = condo.amenities || [];

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back */}
        <Link
          href="/condominios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para condomínios
        </Link>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 aspect-[16/6]">
          {condo.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={condo.cover_image_url}
              alt={condo.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-24 h-24 text-emerald-500/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {condo.name}
            </h1>
            {(condo.city || condo.state) && (
              <div className="flex items-center gap-1.5 text-white/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {[condo.neighborhood, condo.city, condo.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {condo.description && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Sobre o condomínio</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {condo.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Infraestrutura</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((amenity) => {
                    const amenityKey = amenity.toLowerCase();
                    const def = AMENITY_ICONS[amenityKey];
                    const Icon = def ? def.icon : Building2;
                    const label = def ? def.label : amenity;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            {condo.lat != null && condo.lng != null && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Localização
                </h2>
                <CondominioMap
                  lat={condo.lat}
                  lng={condo.lng}
                  name={condo.name}
                  address={[condo.neighborhood, condo.city, condo.state].filter(Boolean).join(", ")}
                />
              </div>
            )}

            {/* Properties section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Imóveis disponíveis
                {properties.length > 0 && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    ({properties.length})
                  </span>
                )}
              </h2>

              {properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-border/30 rounded-xl">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum imóvel disponível no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {properties.map((property) => {
                    const images = Array.isArray(property.images) ? property.images : [];
                    const coverImage = images[0]?.filename;
                    return (
                      <PropertyCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        price={property.price}
                        area={property.area}
                        city={property.city}
                        state={property.state}
                        type={property.type}
                        characteristics={Array.isArray(property.characteristics) ? property.characteristics as string[] : []}
                        image={coverImage}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price summary */}
              {minPrice != null && (
                <Card className="p-5 bg-card border-border/50">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    Faixa de preços
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">A partir de</p>
                      <p className="text-xl font-bold text-emerald-400">{formatPrice(minPrice)}</p>
                    </div>
                    {maxPrice != null && maxPrice !== minPrice && (
                      <div>
                        <p className="text-xs text-muted-foreground">Até</p>
                        <p className="text-lg font-semibold">{formatPrice(maxPrice)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Stats card */}
              <Card className="p-5 bg-card border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Imóveis disponíveis</span>
                    <span className="text-sm font-semibold text-emerald-400">{properties.length}</span>
                  </div>
                  {amenities.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amenidades</span>
                      <span className="text-sm font-semibold">{amenities.length}</span>
                    </div>
                  )}
                  {condo.neighborhood && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bairro</span>
                      <span className="text-sm font-semibold">{condo.neighborhood}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Amenity badges in sidebar */}
              {amenities.length > 0 && (
                <Card className="p-5 bg-card border-border/50">
                  <h3 className="text-sm font-semibold mb-3">Infraestrutura</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.map((a) => (
                      <Badge
                        key={a}
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                      >
                        {a}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
