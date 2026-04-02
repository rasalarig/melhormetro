"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Share2, Eye, Maximize } from "lucide-react";
import { LikeButton } from "@/components/like-button";

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface PropertyReelProps {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  characteristics: string[];
  images: PropertyImage[];
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

export function PropertyReel({
  id,
  title,
  price,
  area,
  type,
  city,
  state,
  characteristics,
  images,
}: PropertyReelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const imageUrls = images
    .filter((img) => img.filename)
    .map((img) => `/uploads/${img.filename}`);

  const hasMultipleImages = imageUrls.length > 1;

  // IntersectionObserver to detect visibility
  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-slideshow every 4 seconds when visible
  useEffect(() => {
    if (isVisible && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, hasMultipleImages, imageUrls.length]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} - ${formatPrice(price)}`,
          url: `${window.location.origin}/imoveis/${id}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/imoveis/${id}`
      );
    }
  }, [title, price, id]);

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no imóvel: ${title} - ${formatPrice(price)}. Link: ${typeof window !== "undefined" ? window.location.origin : ""}/imoveis/${id}`
  );

  return (
    <div
      ref={reelRef}
      className="reel-item relative w-full overflow-hidden bg-black"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* Background Images with Crossfade */}
      {imageUrls.length > 0 ? (
        <div className="absolute inset-0">
          {imageUrls.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={`${title} - imagem ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              style={{ opacity: index === currentImageIndex ? 1 : 0 }}
              loading="lazy"
            />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
          <Maximize className="w-20 h-20 opacity-20 text-white" />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 z-10" />

      {/* Image indicators */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {imageUrls.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "w-6 bg-emerald-400"
                  : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Property type badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className="bg-emerald-500/90 text-white border-0 text-xs px-3 py-1">
          {typeLabels[type] || type}
        </Badge>
      </div>

      {/* Content overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-16 z-20 p-5 pb-6">
        <p className="text-emerald-400 font-bold text-2xl md:text-3xl mb-1">
          {formatPrice(price)}
        </p>

        <h2 className="text-white font-semibold text-base md:text-lg mb-2 line-clamp-2">
          {title}
        </h2>

        <div className="flex items-center gap-1.5 text-white/70 text-sm mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            {city}, {state}
          </span>
        </div>

        <div className="text-white/60 text-sm mb-3">{area} m&sup2;</div>

        {characteristics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {characteristics.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {characteristics.length > 4 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 backdrop-blur-sm">
                +{characteristics.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons (right side, vertical) */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
        {/* Like button */}
        <LikeButton propertyId={id} size="lg" showCount />

        {/* WhatsApp button */}
        <a
          href={`https://wa.me/?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 group"
          aria-label="WhatsApp"
        >
          <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white fill-current"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span className="text-white/70 text-[10px]">WhatsApp</span>
        </a>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group"
          aria-label="Compartilhar"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/70 text-[10px]">Enviar</span>
        </button>

        {/* Ver Detalhes button */}
        <Link
          href={`/imoveis/${id}`}
          className="flex flex-col items-center gap-1 group"
          aria-label="Ver detalhes"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/70 text-[10px]">Detalhes</span>
        </Link>
      </div>
    </div>
  );
}
