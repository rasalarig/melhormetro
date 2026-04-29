"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Share2, Eye, Maximize, Play } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { ReimaginePanelTrigger, ReimaginePanelDialog } from "@/components/reimagine-panel";
import { useEngagement } from "@/hooks/use-engagement";
import { isVideoUrl, isExternalVideoUrl, isEmbeddableVideo, getEmbedUrl, resolveMediaUrl } from "@/lib/media-utils";

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
  tourTitle?: string;
  tourId?: number;
}

const typeLabels: Record<string, string> = {
  terreno: "Terreno",
  terreno_condominio: "Terreno em Condomínio",
  casa: "Casa",
  casa_condominio: "Casa em Condomínio",
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
  tourTitle,
}: PropertyReelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showReimaginePanelOpen, setShowReimaginePanelOpen] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { trackEvent } = useEngagement(id);
  const halfTrackedRef = useRef(false);
  const completeTrackedRef = useRef(false);

  // Touch swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const mediaUrls = images
    .filter((img) => img.filename)
    .map((img) => resolveMediaUrl(img.filename));

  const imageUrls = mediaUrls;

  const hasMultipleImages = imageUrls.length > 1;

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left - next
        setCurrentImageIndex((prev) => prev === imageUrls.length - 1 ? 0 : prev + 1);
      } else {
        // Swipe right - previous
        setCurrentImageIndex((prev) => prev === 0 ? imageUrls.length - 1 : prev - 1);
      }
    }
  }, [imageUrls.length]);

  // Video play/pause when navigating slides
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === currentImageIndex && isVisible) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentImageIndex, isVisible]);

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

  // Engagement view tracking
  useEffect(() => {
    if (isVisible) {
      const halfTimer = setTimeout(() => {
        if (!halfTrackedRef.current) {
          halfTrackedRef.current = true;
          trackEvent('view_half', 5);
        }
      }, 5000);

      const completeTimer = setTimeout(() => {
        if (!completeTrackedRef.current) {
          completeTrackedRef.current = true;
          trackEvent('view_complete', 10);
        }
      }, 10000);

      return () => {
        clearTimeout(halfTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, trackEvent]);

  const handleShare = useCallback(async () => {
    trackEvent('share');
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
  }, [title, price, id, trackEvent]);

  const whatsappMessage = encodeURIComponent(
    `Ol\u00e1! Tenho interesse no im\u00f3vel: ${title} - ${formatPrice(price)}. Link: ${typeof window !== "undefined" ? window.location.origin : ""}/imoveis/${id}`
  );

  return (
    <div
      ref={reelRef}
      className="reel-item group relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images with Crossfade */}
      {imageUrls.length > 0 ? (
        <div
          className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900"
        >
          {/* Shimmer skeleton shown while media loads */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
          {imageUrls.map((url, index) => {
            if (isExternalVideoUrl(url)) {
              const embedUrl = getEmbedUrl(url);
              if (embedUrl && isEmbeddableVideo(url)) {
                return (
                  <div
                    key={url}
                    className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: index === currentImageIndex ? 1 : 0 }}
                  >
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                );
              }
              // TikTok / Instagram - show clickable overlay that opens in new tab
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 transition-opacity duration-1000 ease-in-out"
                  style={{ opacity: index === currentImageIndex ? 1 : 0 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-white/80 text-sm font-medium">
                      {/tiktok/i.test(url) ? "Ver no TikTok" : "Ver no Instagram"}
                    </p>
                  </div>
                </a>
              );
            }
            if (isVideoUrl(url)) {
              return (
                <video
                  key={url}
                  ref={(el) => { videoRefs.current[index] = el; }}
                  src={url}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                  style={{ opacity: index === currentImageIndex ? 1 : 0 }}
                  loop
                  playsInline
                  preload="metadata"
                  autoPlay={index === currentImageIndex}
                />
              );
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={`${title} - imagem ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                style={{ opacity: 0 }}
                loading="lazy"
                onLoad={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.opacity = index === currentImageIndex ? "1" : "0";
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
          <Maximize className="w-20 h-20 opacity-20 text-white" />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 z-10" />

      {/* Dot indicators - TikTok style, top area */}
      {hasMultipleImages && (
        <div className="absolute top-14 md:top-20 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {imageUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`rounded-full transition-all duration-500 ease-out ${
                index === currentImageIndex
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Ir para imagem ${index + 1}`}
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

      {/* Tour title overlay (top center, only when it's a named non-original tour) */}
      {tourTitle && (
        <div className="absolute top-4 left-24 right-16 z-20 flex justify-center pointer-events-none">
          <span className="block bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full truncate max-w-full">
            {tourTitle}
          </span>
        </div>
      )}

      {/* Content overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-14 z-20 p-4 md:p-5 pb-20 md:pb-6">
        <p className="text-emerald-400 font-bold text-xl md:text-3xl mb-1">
          {formatPrice(price)}
        </p>

        <h2 className="text-white font-semibold text-sm md:text-lg mb-1.5 line-clamp-2 leading-snug">
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
          className="flex flex-col items-center gap-1 group/wa"
          aria-label="WhatsApp"
          onClick={() => trackEvent('click_whatsapp')}
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
          className="flex flex-col items-center gap-1 group/share"
          aria-label="Compartilhar"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/70 text-[10px]">Enviar</span>
        </button>

        {/* Reimaginar button - only for images, not terrenos */}
        {imageUrls[currentImageIndex] && !isVideoUrl(imageUrls[currentImageIndex]) && !isExternalVideoUrl(imageUrls[currentImageIndex]) && type !== "terreno" && type !== "terreno_condominio" && (
          <ReimaginePanelTrigger
            variant="reel"
            onClick={() => setShowReimaginePanelOpen(true)}
          />
        )}

        {/* Ver Detalhes button */}
        <Link
          href={`/imoveis/${id}`}
          className="flex flex-col items-center gap-1 group/details"
          aria-label="Ver detalhes"
          onClick={() => trackEvent('click_details')}
        >
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/70 text-[10px]">Detalhes</span>
        </Link>
      </div>

      {/* Reimagine Panel Dialog */}
      {imageUrls[currentImageIndex] && (
        <ReimaginePanelDialog
          imageUrl={imageUrls[currentImageIndex]}
          isOpen={showReimaginePanelOpen}
          onClose={() => setShowReimaginePanelOpen(false)}
        />
      )}
    </div>
  );
}
