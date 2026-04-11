"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Maximize,
  ArrowLeft,
  Phone,
  MessageCircle,
  Home,
  Shield,
  Car,
  Droplets,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { InterestModal } from "./interest-modal";
import { LikeButton } from "./like-button";
import { ReimaginePanelTrigger, ReimaginePanelDialog } from "./reimagine-panel";
import { isVideoUrl, resolveMediaUrl } from "@/lib/media-utils";

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
    images: PropertyImage[];
  };
}

export function PropertyDetail({ property }: PropertyProps) {
  const characteristics: string[] = JSON.parse(
    property.characteristics || "[]"
  );
  const details: Record<string, unknown> = JSON.parse(
    property.details || "{}"
  );
  const [currentImage, setCurrentImage] = useState(0);
  const [showInterest, setShowInterest] = useState(false);
  const [reimagineOpen, setReimagineOpen] = useState(false);

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

        {/* Image Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 aspect-video">
          {property.images.length > 0 ? (
            <>
              {(() => {
                const currentFilename = property.images[currentImage]?.filename || '';
                const currentUrl = resolveMediaUrl(currentFilename);
                const currentIsVideo = isVideoUrl(currentUrl);
                return currentIsVideo ? (
                  <video
                    key={currentUrl}
                    src={currentUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUrl}
                      alt={property.images[currentImage]?.original_name || property.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {property.type !== "terreno" && property.type !== "terreno_condominio" && (
                      <ReimaginePanelTrigger
                        variant="detail"
                        onClick={() => setReimagineOpen(true)}
                      />
                    )}
                  </div>
                );
              })()}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage(Math.max(0, currentImage - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImage(
                        Math.min(property.images.length - 1, currentImage + 1)
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {property.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImage
                            ? "bg-emerald-400"
                            : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Maximize className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm opacity-40">Imagens em breve</p>
              </div>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-emerald-500/90 text-white border-0 px-3 py-1">
              {typeLabels[property.type] || property.type}
            </Badge>
          </div>

          {/* Like & Share buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LikeButton propertyId={property.id} size="md" showCount />
            <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
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
                <span>{property.address}</span>
                {property.neighborhood && (
                  <span>- {property.neighborhood}</span>
                )}
                <span>
                  - {property.city}, {property.state}
                </span>
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

            {/* Location placeholder */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Localização
              </h2>
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
                address={`${property.address}, ${property.city} - ${property.state}`}
              />
            </div>
          </div>

          {/* Sidebar - Price & Contact */}
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
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Publicado em {formatDate(property.created_at)}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <InterestModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={showInterest}
        onClose={() => setShowInterest(false)}
      />

      {property.images.length > 0 && property.type !== "terreno" && property.type !== "terreno_condominio" && (() => {
        const currentFilename = property.images[currentImage]?.filename || '';
        const currentUrl = resolveMediaUrl(currentFilename);
        const currentIsVideo = isVideoUrl(currentUrl);
        return !currentIsVideo ? (
          <ReimaginePanelDialog
            imageUrl={currentUrl}
            isOpen={reimagineOpen}
            onClose={() => setReimagineOpen(false)}
          />
        ) : null;
      })()}
    </div>
  );
}
