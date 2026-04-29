"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  isVideoUrl,
  isExternalVideoUrl,
  isEmbeddableVideo,
  getEmbedUrl,
  getVideoPlatformName,
  resolveMediaUrl,
} from "@/lib/media-utils";

export interface MediaItem {
  url: string;
  type?: "image" | "video" | "youtube" | "vimeo" | "tiktok" | "instagram";
  alt?: string;
}

interface PropertyMediaGalleryProps {
  items: MediaItem[];
  propertyTitle?: string;
  onImageClick?: (url: string) => void;
}

function buildItems(raw: MediaItem[]): MediaItem[] {
  return raw
    .filter((m) => m.url)
    .map((m) => ({ ...m, url: resolveMediaUrl(m.url) }));
}

// ---------- Native video slide ----------
interface NativeVideoSlideProps {
  url: string;
  isActive: boolean;
  isFullscreen: boolean;
}

function NativeVideoSlide({ url, isActive, isFullscreen }: NativeVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoplay / pause based on active state and IntersectionObserver
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isActive) {
          el.play().catch(() => {});
          setPlaying(true);
        } else {
          el.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isActive]);

  // When active state changes, play or pause
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
    resetHideTimer();
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    resetHideTimer();
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    setDuration(el.duration);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * el.duration;
    resetHideTimer();
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [resetHideTimer]);

  function formatTime(s: number): string {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* Shimmer skeleton while video loads */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        playsInline
        muted={muted}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => { handleLoadedMetadata(); setVideoLoaded(true); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2.5 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {duration > 0 && (
            <div className="flex justify-between text-white/70 text-xs mt-1 px-0.5">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>

          {muted && (
            <span className="text-white/70 text-xs bg-black/40 px-2 py-0.5 rounded-full">
              Clique no alto-falante para ativar o som
            </span>
          )}
        </div>
      </div>

      {/* Big play/pause icon on tap */}
      {!playing && !isFullscreen && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Reproduzir"
        >
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// ---------- Iframe slide (YouTube / Vimeo) ----------
interface IframeSlideProps {
  url: string;
  isActive: boolean;
}

function IframeSlide({ url, isActive }: IframeSlideProps) {
  const embedUrl = getEmbedUrl(url);
  const platformName = getVideoPlatformName(url) || "Vídeo externo";

  if (!embedUrl || !isEmbeddableVideo(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
          <p className="text-white/80 text-sm font-medium">Abrir {platformName}</p>
        </div>
      </a>
    );
  }

  // Append autoplay=1 for YouTube when active
  let finalUrl = embedUrl;
  if (/youtube\.com/.test(embedUrl) && isActive) {
    finalUrl = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1`;
  }

  return (
    <iframe
      key={isActive ? "active" : "inactive"}
      src={finalUrl}
      className="absolute inset-0 w-full h-full"
      frameBorder="0"
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
    />
  );
}

// ---------- Main gallery component ----------
export function PropertyMediaGallery({
  items,
  propertyTitle = "Imóvel",
  onImageClick,
}: PropertyMediaGalleryProps) {
  const media = buildItems(items);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const total = media.length;

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? total - 1 : c - 1));
  }, [total]);

  const next = useCallback(() => {
    setCurrent((c) => (c === total - 1 ? 0 : c + 1));
  }, [total]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbnailsRef.current;
    if (!container) return;
    const thumb = container.children[current] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [current]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape" && fullscreen) setFullscreen(false);
    },
    [prev, next, fullscreen]
  );

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
  }, [next, prev]);

  // Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!fullscreen) {
      // Try native fullscreen first
      const el = containerRef.current;
      if (el && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
      setFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setFullscreen(false);
    }
  }, [fullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (total === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900/30 to-teal-900/30 aspect-video flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Maximize2 className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="text-sm opacity-40">Imagens em breve</p>
        </div>
      </div>
    );
  }

  const item = media[current];
  const isNativeVideo =
    !isExternalVideoUrl(item.url) && isVideoUrl(item.url);
  const isExternal = isExternalVideoUrl(item.url);
  const isImage = !isNativeVideo && !isExternal;

  const galleryClasses = fullscreen
    ? "fixed inset-0 z-50 bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col"
    : "relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900";

  return (
    <div
      ref={containerRef}
      className={galleryClasses}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* ---- Main display ---- */}
      <div
        className={`relative ${fullscreen ? "flex-1" : "aspect-video"} overflow-hidden`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides — all rendered, only active visible */}
        {media.map((m, idx) => {
          const isAct = idx === current;
          const nv = !isExternalVideoUrl(m.url) && isVideoUrl(m.url);
          const ext = isExternalVideoUrl(m.url);
          const img = !nv && !ext;

          return (
            <div
              key={`${m.url}-${idx}`}
              className={`absolute inset-0 transition-opacity duration-300 ${
                isAct ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {nv && (
                <NativeVideoSlide
                  url={m.url}
                  isActive={isAct}
                  isFullscreen={fullscreen}
                />
              )}
              {ext && <IframeSlide url={m.url} isActive={isAct} />}
              {img && (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900">
                  {/* Shimmer skeleton while image loads */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.alt || `${propertyTitle} - imagem ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full ${
                      fullscreen ? "object-contain" : "object-cover"
                    } ${onImageClick ? "cursor-zoom-in" : ""} transition-opacity duration-300`}
                    style={{ opacity: 0 }}
                    onClick={() => {
                      if (onImageClick && isAct && img) onImageClick(m.url);
                    }}
                    loading={idx === 0 ? "eager" : "lazy"}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Counter badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full pointer-events-none">
          {current + 1}/{total}
        </div>

        {/* Arrow buttons — desktop */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {fullscreen ? (
            <Minimize2 className="w-4 h-4 text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Close button when fullscreen (fallback for browsers not exiting) */}
        {fullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Fechar tela cheia"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Video type badge */}
        {(isNativeVideo || isExternal) && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
            <Play className="w-3 h-3" />
            {isExternal
              ? (getVideoPlatformName(item.url) ?? "Vídeo")
              : "Vídeo"}
          </div>
        )}
      </div>

      {/* ---- Thumbnail strip ---- */}
      {total > 1 && (
        <div
          ref={thumbnailsRef}
          className={`flex gap-2 overflow-x-auto scrollbar-hide px-2 py-2 ${
            fullscreen ? "bg-zinc-900/80" : "bg-zinc-900/90 rounded-b-2xl"
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {media.map((m, idx) => {
            const isAct = idx === current;
            const nv = !isExternalVideoUrl(m.url) && isVideoUrl(m.url);
            const ext = isExternalVideoUrl(m.url);
            const img = !nv && !ext;

            return (
              <button
                key={`thumb-${m.url}-${idx}`}
                onClick={() => setCurrent(idx)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  isAct
                    ? "border-emerald-400 opacity-100"
                    : "border-transparent opacity-60 hover:opacity-90"
                }`}
                aria-label={`Ir para mídia ${idx + 1}`}
              >
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.alt || `Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                {nv && (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white/80" />
                  </div>
                )}
                {ext && (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white/80" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
