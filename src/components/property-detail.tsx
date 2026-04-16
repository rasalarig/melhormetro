"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  ArrowLeft,
  Phone,
  MessageCircle,
  Home,
  Shield,
  Car,
  Droplets,
  Calendar,
  Tag,
  ChevronRight,
  Share2,
  Handshake,
  Building2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { InterestModal } from "./interest-modal";
import { LikeButton } from "./like-button";
import { ReimaginePanelTrigger, ReimaginePanelDialog } from "./reimagine-panel";
import { isVideoUrl, isExternalVideoUrl, resolveMediaUrl } from "@/lib/media-utils";
import { useAuth } from "@/components/auth-provider";
import { PropertyChat } from "@/components/property-chat";
import { Eye, X as XIcon, Pencil, Film, BarChart3 } from "lucide-react";

function StreetViewSection({ lat, lng }: { lat: number; lng: number }) {
  const [showStreetView, setShowStreetView] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

  if (!apiKey) return null;

  return (
    <div className="mt-3">
      {!showStreetView ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStreetView(true)}
          className="w-full border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/50"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Street View (visão 360°)
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Street View</p>
            <button
              onClick={() => setShowStreetView(false)}
              className="p-1 rounded hover:bg-accent/50 text-muted-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-border/50">
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?location=${lat},${lng}&heading=210&pitch=10&fov=90&key=${apiKey}`}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Imagem do Google Street View. Pode não corresponder ao estado atual do local.
          </p>
        </div>
      )}
    </div>
  );
}
import { SolarCompass } from "@/components/solar-compass";
import { ValuationScore } from "@/components/valuation-score";
import { calculateValuationScore } from "@/lib/valuation-score";
import { PropertyMediaGallery } from "@/components/property-media-gallery";
import type { MediaItem } from "@/components/property-media-gallery";
const PropertyMap = dynamic(() => import("./property-map"), { ssr: false });

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface PropertyProps {
  property: {
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
    status: string;
    characteristics: string;
    details: string;
    created_at: string;
    updated_at: string;
    latitude: number | null;
    longitude: number | null;
    address_privacy?: "exact" | "approximate";
    approximate_radius_km?: number | null;
    allow_resale?: boolean;
    resale_commission_percent?: number | null;
    resale_terms?: string | null;
    seller_user_id?: number | null;
    facade_orientation?: string | null;
    condominium_id?: number | null;
    condominium_name?: string | null;
    condominium_slug?: string | null;
    images: PropertyImage[];
    /** Combined media list from tour_media (preferred) or property_images (fallback) */
    mediaItems?: MediaItem[];
  };
}

export function PropertyDetail({ property }: PropertyProps) {
  const { user } = useAuth();
  const characteristics: string[] = JSON.parse(
    property.characteristics || "[]"
  );
  const details: Record<string, unknown> = JSON.parse(
    property.details || "{}"
  );
  const [showInterest, setShowInterest] = useState(false);
  const [reimagineOpen, setReimagineOpen] = useState(false);
  const [reimagineUrl, setReimagineUrl] = useState<string>("");
  const [resaleContactLoading, setResaleContactLoading] = useState(false);
  const [resaleContactDone, setResaleContactDone] = useState(false);


  const isAutonomo = user?.profiles?.some((p) => p.profile_type === "autonomo") ?? false;
  const isOwner = user && property.seller_user_id && user.id === property.seller_user_id;

  // Build the media items list for the gallery.
  // Priority: property.mediaItems (from tour_media or pre-built) → property.images fallback.
  const galleryItems: MediaItem[] = property.mediaItems && property.mediaItems.length > 0
    ? property.mediaItems
    : property.images.map((img) => ({
        url: img.filename,
        type: "image" as const,
        alt: img.original_name,
      }));

  // Determine the first plain image URL for the Reimagine panel.
  const firstImageUrl: string = (() => {
    for (const item of galleryItems) {
      const url = resolveMediaUrl(item.url);
      if (!isVideoUrl(url) && !isExternalVideoUrl(url)) return url;
    }
    return "";
  })();

  const canReimagine =
    firstImageUrl !== "" &&
    property.type !== "terreno" &&
    property.type !== "terreno_condominio";

  const handleImageClick = (url: string) => {
    if (!canReimagine) return;
    const resolved = resolveMediaUrl(url);
    if (!isVideoUrl(resolved) && !isExternalVideoUrl(resolved)) {
      setReimagineUrl(resolved);
      setReimagineOpen(true);
    }
  };

  const handleResaleContact = async () => {
    if (!user || !property.seller_user_id) return;
    setResaleContactLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          other_user_id: property.seller_user_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResaleContactDone(true);
        window.location.href = `/mensagens?conversation=${data.conversation?.id ?? ""}`;
      }
    } catch {
      // ignore
    } finally {
      setResaleContactLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const typeLabels: Record<string, string> = {
    terreno: "Terreno",
    terreno_condominio: "Terreno em Condomínio",
    casa: "Casa",
    casa_condominio: "Casa em Condomínio",
    apartamento: "Apartamento",
    comercial: "Comercial",
    rural: "Rural",
  };

  const detailIcons: Record<
    string,
    { icon: typeof Home; label: string }
  > = {
    bedrooms: { icon: Home, label: "Quartos" },
    bathrooms: { icon: Droplets, label: "Banheiros" },
    garage: { icon: Car, label: "Vagas" },
    pool: { icon: Droplets, label: "Piscina" },
    gated_community: { icon: Shield, label: "Condomínio Fechado" },
    paved_street: { icon: Car, label: "Rua Asfaltada" },
  };

  return (
    <div className="pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back button */}
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para imóveis
        </Link>

        {/* Media Gallery (hero) */}
        <div className="relative mb-4">
          <PropertyMediaGallery
            items={galleryItems}
            propertyTitle={property.title}
            onImageClick={canReimagine ? handleImageClick : undefined}
          />

          {/* Property type badge — overlaid on top-left of gallery */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <Badge className="bg-emerald-500/90 text-white border-0 px-3 py-1">
              {typeLabels[property.type] || property.type}
            </Badge>
          </div>

          {/* Like & Share — overlaid on top-right of gallery */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <LikeButton propertyId={property.id} size="md" showCount />
            <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Reimagine trigger — bottom-right of gallery, above thumbnails */}
          {canReimagine && (
            <div className="absolute bottom-14 right-4 z-10">
              <ReimaginePanelTrigger
                variant="detail"
                onClick={() => {
                  setReimagineUrl(firstImageUrl);
                  setReimagineOpen(true);
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {property.address_privacy === "approximate" ? (
                  <>
                    {property.neighborhood && (
                      <span>{property.neighborhood}</span>
                    )}
                    <span>
                      {property.neighborhood ? "- " : ""}{property.city}, {property.state}
                    </span>
                  </>
                ) : (
                  <>
                    <span>{property.address}</span>
                    {property.neighborhood && (
                      <span>- {property.neighborhood}</span>
                    )}
                    <span>
                      - {property.city}, {property.state}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card border-border/50 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {property.area}m&sup2;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Área Total
                </p>
              </Card>
              {Number(details.bedrooms) > 0 && (
                <Card className="p-4 bg-card border-border/50 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {String(details.bedrooms)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Quartos</p>
                </Card>
              )}
              {Number(details.bathrooms) > 0 && (
                <Card className="p-4 bg-card border-border/50 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {String(details.bathrooms)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Banheiros
                  </p>
                </Card>
              )}
              {Number(details.garage) > 0 && (
                <Card className="p-4 bg-card border-border/50 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {String(details.garage)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Vagas</p>
                </Card>
              )}
            </div>

            <Separator className="bg-border/50" />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Descrição</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <Separator className="bg-border/50" />

            {/* Characteristics */}
            {characteristics.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Características
                </h2>
                <div className="flex flex-wrap gap-2">
                  {characteristics.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-border/50" />

            {/* Details/Amenities */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Detalhes do Imóvel</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(details).map(([key, value]) => {
                  const detail = detailIcons[key];
                  if (!detail) return null;
                  const Icon = detail.icon;
                  const displayValue =
                    typeof value === "boolean"
                      ? value
                        ? "Sim"
                        : "Não"
                      : String(value);

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {detail.label}
                        </p>
                        <p className="text-sm font-medium">{displayValue}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resale section — visible to autônomos only */}
            {property.allow_resale && isAutonomo && (
              <>
                <Separator className="bg-border/50" />
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base font-semibold text-foreground">
                      Disponível para recomercialização
                    </h2>
                  </div>
                  {property.resale_commission_percent != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Comissão oferecida:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                        {property.resale_commission_percent}%
                      </span>
                    </div>
                  )}
                  {property.resale_terms && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Termos e condições:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {property.resale_terms}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleResaleContact}
                    disabled={resaleContactLoading || resaleContactDone}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white mt-2"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    {resaleContactDone ? "Mensagem enviada!" : resaleContactLoading ? "Aguarde..." : "Quero comercializar este imóvel"}
                  </Button>
                </div>
              </>
            )}

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Localização
              </h2>
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
                address={
                  property.address_privacy === "approximate"
                    ? `${property.neighborhood ? property.neighborhood + ", " : ""}${property.city} - ${property.state}`
                    : `${property.address}, ${property.city} - ${property.state}`
                }
                address_privacy={property.address_privacy}
                approximate_radius_km={property.approximate_radius_km}
              />
              {property.latitude != null && property.longitude != null && property.address_privacy !== "approximate" && (
                <StreetViewSection lat={property.latitude} lng={property.longitude} />
              )}
            </div>

            {/* Solar orientation section */}
            {property.latitude != null &&
              property.longitude != null &&
              property.facade_orientation && (
                <>
                  <Separator className="bg-border/50" />
                  <SolarCompass
                    latitude={property.latitude}
                    longitude={property.longitude}
                    facadeOrientation={property.facade_orientation}
                  />
                </>
              )}

            {/* Valuation Score */}
            <Separator className="bg-border/50" />
            <div>
              <h3 className="text-lg font-semibold mb-4">Índice de Valorização Imobiliária</h3>
              <ValuationScore result={calculateValuationScore(property)} />
            </div>
          </div>

          {/* Sidebar - Price & Contact / Owner Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-6 bg-card border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-3xl font-bold text-emerald-400 mb-4">
                  {formatPrice(property.price)}
                </p>

                {property.area > 0 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    {formatPrice(property.price / property.area)}/m&sup2;
                  </p>
                )}

                {isOwner ? (
                  /* Owner actions */
                  <div className="space-y-2">
                    <div className="text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3 text-center">
                      Este é o seu imóvel
                    </div>
                    <Link href={`/vender/imovel/${property.id}`}>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar Imóvel
                      </Button>
                    </Link>
                    <Link href={`/vender/imovel/${property.id}/tours`}>
                      <Button variant="outline" className="w-full border-border/50 mt-2">
                        <Film className="w-4 h-4 mr-2" />
                        Gerenciar Tours
                      </Button>
                    </Link>
                    <Link href="/vender/leads">
                      <Button variant="outline" className="w-full border-border/50 mt-2">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Leads
                      </Button>
                    </Link>
                    <Link href="/mensagens">
                      <Button variant="outline" className="w-full border-border/50 mt-2">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensagens
                      </Button>
                    </Link>
                  </div>
                ) : (
                  /* Visitor actions */
                  <>
                    <Button
                      onClick={() => setShowInterest(true)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white mb-3"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Tenho Interesse
                    </Button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title}\n${property.city}, ${property.state}\nValor: ${formatPrice(property.price)}\n\nVi no MelhorMetro!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  </>
                )}
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Publicado em {formatDate(property.created_at)}
                </div>
              </Card>

              {/* Condominium link */}
              {property.condominium_id && property.condominium_slug && (
                <Link href={`/condominios/${property.condominium_slug}`}>
                  <Card className="p-4 bg-card border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Este imóvel está no</p>
                        <p className="text-sm font-semibold text-emerald-400 truncate">
                          {property.condominium_name || "Condomínio"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <PropertyChat
        propertyId={property.id}
        propertyTitle={property.title}
        propertyType={property.type}
      />

      <InterestModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={showInterest}
        onClose={() => setShowInterest(false)}
      />

      {canReimagine && reimagineUrl && (
        <ReimaginePanelDialog
          imageUrl={reimagineUrl}
          isOpen={reimagineOpen}
          onClose={() => setReimagineOpen(false)}
        />
      )}
    </div>
  );
}
