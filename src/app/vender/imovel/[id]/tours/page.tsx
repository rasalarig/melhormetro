"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  ImageIcon,
  Upload,
  Link2,
  X,
  Play,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { isVideoUrl, resolveMediaUrl } from "@/lib/media-utils";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_VIDEO = 100 * 1024 * 1024; // 100MB

interface TourMedia {
  id: number;
  media_url: string;
  media_type: string;
  display_order: number;
}

interface ModerationIssueDetail {
  detected: boolean;
  confidence: number;
  reason: string;
}

interface ModerationImageResult {
  url: string;
  passed: boolean;
  issues: string[];
  details: {
    sexual_content: ModerationIssueDetail;
    non_property: ModerationIssueDetail;
    watermark: ModerationIssueDetail;
  };
}

interface ModerationResult {
  status: string;
  analyzedAt?: string;
  results?: ModerationImageResult[];
  failedImages?: ModerationImageResult[];
  adminOverride?: { reason?: string };
}

interface Tour {
  id: number;
  property_id: number;
  title: string | null;
  description: string | null;
  status: "active" | "inactive" | "deleted";
  moderation_status: "pending" | "approved" | "rejected";
  moderation_result?: ModerationResult | null;
  is_original: boolean;
  created_at: string;
  media: TourMedia[];
}

interface MediaEntry {
  url: string;
  file?: File;
  preview?: string;
  type: "image" | "video";
  uploading?: boolean;
}

interface Property {
  id: number;
  title: string;
}

const moderationConfig = {
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  },
  approved: {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  rejected: {
    label: "Rejeitado",
    icon: XCircle,
    className: "bg-red-500/10 border-red-500/20 text-red-400",
  },
};

function TourThumbnail({ media }: { media: TourMedia[] }) {
  const first = media?.[0];
  if (!first) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
        <Camera className="w-8 h-8 text-emerald-500/40" />
      </div>
    );
  }

  const url = resolveMediaUrl(first.media_url);
  if (isVideoUrl(url)) {
    return (
      <div className="relative w-full h-full">
        <video
          src={`${url}#t=0.1`}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Tour thumbnail"
      className="w-full h-full object-cover"
    />
  );
}

function TourForm({
  initialTitle,
  initialDescription,
  initialMedia,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialMedia?: MediaEntry[];
  onSubmit: (data: { title: string; description: string; media: MediaEntry[] }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [media, setMedia] = useState<MediaEntry[]>(initialMedia || []);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Drag-to-reorder state
  const [mediaDragIndex, setMediaDragIndex] = useState<number | null>(null);
  const [mediaOverIndex, setMediaOverIndex] = useState<number | null>(null);
  const mediaDragRef = useRef<number | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const newEntries: MediaEntry[] = [];
      for (const file of Array.from(files)) {
        const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
        const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
        if (!isImage && !isVideo) continue;

        const maxSize = isVideo ? MAX_FILE_SIZE_VIDEO : MAX_FILE_SIZE_IMAGE;
        if (file.size > maxSize) continue;

        const preview = isImage ? URL.createObjectURL(file) : undefined;
        newEntries.push({
          url: "",
          file,
          preview,
          type: isImage ? "image" : "video",
          uploading: false,
        });
      }
      if (newEntries.length === 0) return;

      setMedia((prev) => [...prev, ...newEntries]);

      // Upload files
      const formData = new FormData();
      for (const entry of newEntries) {
        if (entry.file) formData.append("files", entry.file);
      }

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          const uploadedFiles: { url: string; type: string }[] = data.files || [];
          setMedia((prev) => {
            const updated = [...prev];
            let uploadIdx = 0;
            for (let i = 0; i < updated.length; i++) {
              if (updated[i].file && newEntries.some((e) => e.file === updated[i].file)) {
                const uploaded = uploadedFiles[uploadIdx++];
                if (uploaded) {
                  updated[i] = {
                    ...updated[i],
                    url: uploaded.url,
                    uploading: false,
                  };
                }
              }
            }
            return updated;
          });
        }
      } catch {
        // Upload failed — remove failed entries
        setMedia((prev) => prev.filter((e) => !newEntries.some((ne) => ne.file === e.file)));
      }
    },
    []
  );

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setUrlError("URL inválida");
      return;
    }
    setUrlError("");

    let type: MediaEntry["type"] = "image";
    if (/\.(mp4|mov|webm)$/i.test(trimmed)) type = "video";
    else if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com/i.test(trimmed))
      type = "video";

    setMedia((prev) => [...prev, { url: trimmed, type }]);
    setUrlInput("");
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMediaDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    mediaDragRef.current = index;
    setMediaDragIndex(index);
  }, []);

  const handleMediaDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setMediaOverIndex(index);
  }, []);

  const handleMediaDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = mediaDragRef.current;
    setMediaDragIndex(null);
    setMediaOverIndex(null);
    mediaDragRef.current = null;
    if (from === null || from === index) return;
    setMedia((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }, []);

  const handleMediaDragEnd = useCallback(() => {
    setMediaDragIndex(null);
    setMediaOverIndex(null);
    mediaDragRef.current = null;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, description, media });
  };

  const inputClass =
    "w-full rounded-lg border border-border/50 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Título do Tour <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Após reforma, Vista da varanda..."
          className={inputClass}
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva este tour..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Fotos e Vídeos
        </label>

        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Clique para selecionar fotos ou vídeos
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            JPG, PNG, WebP (max 10MB) ou MP4, MOV (max 100MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFileSelect(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>

        {/* URL Input */}
        <div className="mt-3 flex gap-2">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError("");
              }}
              placeholder="Cole URL de imagem, YouTube, TikTok..."
              className={`${inputClass} pl-9`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddUrl}
            className="rounded-lg shrink-0"
          >
            Adicionar
          </Button>
        </div>
        {urlError && <p className="text-xs text-red-400 mt-1">{urlError}</p>}

        {/* Media Preview Grid */}
        {media.length > 0 && (
          <>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {media.map((entry, idx) => {
                const displayUrl = entry.preview || (entry.url ? resolveMediaUrl(entry.url) : "");
                return (
                  <div
                    key={idx}
                    draggable={!entry.uploading}
                    onDragStart={(e) => handleMediaDragStart(e, idx)}
                    onDragOver={(e) => handleMediaDragOver(e, idx)}
                    onDrop={(e) => handleMediaDrop(e, idx)}
                    onDragEnd={handleMediaDragEnd}
                    className={`relative aspect-square rounded-lg overflow-hidden border bg-muted/30 transition-opacity ${
                      entry.uploading
                        ? "cursor-default"
                        : "cursor-grab active:cursor-grabbing"
                    } ${
                      mediaDragIndex === idx
                        ? "opacity-40"
                        : mediaOverIndex === idx && mediaDragIndex !== null
                        ? "border-emerald-500 ring-2 ring-emerald-500/40"
                        : "border-border/30"
                    }`}
                  >
                    {entry.uploading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                      </div>
                    ) : displayUrl ? (
                      isVideoUrl(displayUrl) ? (
                        <>
                          <video
                            src={`${displayUrl}#t=0.1`}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                              <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayUrl}
                          alt={`Media ${idx + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Order number */}
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white font-bold px-1.5 py-0.5 rounded pointer-events-none">
                      {idx + 1}
                    </span>

                    {/* Drag handle */}
                    {!entry.uploading && (
                      <div className="absolute top-1 left-1 text-white/70 pointer-events-none">
                        <GripVertical className="w-3 h-3" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500 transition-colors"
                      aria-label="Remover"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Arraste para reordenar. O número indica a ordem de exibição.
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
          disabled={submitting || media.some((m) => m.uploading)}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Tour"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function ToursPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resubmittingId, setResubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [propRes, toursRes] = await Promise.all([
        fetch(`/api/properties/${propertyId}`),
        fetch(`/api/properties/${propertyId}/tours`),
      ]);

      if (propRes.status === 401 || toursRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (propRes.ok) {
        const propData = await propRes.json();
        // The properties/[id] GET returns the property directly (not nested)
        setProperty(propData.property || propData);
      }

      if (toursRes.ok) {
        const toursData = await toursRes.json();
        setTours(toursData.tours || []);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [propertyId, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchData();
  }, [user, authLoading, router, fetchData]);

  const handleCreateTour = async (data: {
    title: string;
    description: string;
    media: MediaEntry[];
  }) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/properties/${propertyId}/tours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title || undefined,
          description: data.description || undefined,
          media: data.media
            .filter((m) => m.url)
            .map((m) => ({ url: m.url, type: m.type })),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao criar tour");
      }
    } catch {
      setError("Erro ao criar tour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTour = async (data: {
    title: string;
    description: string;
    media: MediaEntry[];
  }) => {
    if (!editingTour) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tours/${editingTour.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title || undefined,
          description: data.description || undefined,
          media: data.media
            .filter((m) => m.url)
            .map((m) => ({ url: m.url, type: m.type })),
        }),
      });

      if (res.ok) {
        setEditingTour(null);
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao atualizar tour");
      }
    } catch {
      setError("Erro ao atualizar tour");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitTour = async (tourId: number) => {
    setResubmittingId(tourId);
    setError("");
    try {
      const res = await fetch(`/api/tours/${tourId}/remoderate`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao reenviar para moderação");
      }
    } catch {
      setError("Erro ao reenviar para moderação");
    } finally {
      setResubmittingId(null);
    }
  };

  const handleDeleteTour = async (tourId: number) => {
    if (!confirm("Tem certeza que deseja excluir este tour?")) return;
    setDeletingId(tourId);
    try {
      const res = await fetch(`/api/tours/${tourId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao excluir tour");
      }
    } catch {
      setError("Erro ao excluir tour");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Build initial media for edit form from tour.media
  const buildInitialMedia = (tour: Tour): MediaEntry[] =>
    (tour.media || []).map((m) => ({
      url: m.media_url,
      type: (m.media_type === "image" ? "image" : "video") as MediaEntry["type"],
    }));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto px-4 pt-16 max-w-3xl">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/vender/meus-imoveis"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Meus Imóveis
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tours do Imóvel</h1>
            {property && (
              <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                {property.title}
              </p>
            )}
          </div>
          {!showForm && !editingTour && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Tour
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Create Tour Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-5">Novo Tour</h2>
            <TourForm
              onSubmit={handleCreateTour}
              onCancel={() => {
                setShowForm(false);
                setError("");
              }}
              submitting={submitting}
            />
          </div>
        )}

        {/* Edit Tour Form */}
        {editingTour && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-5">Editar Tour</h2>
            <TourForm
              initialTitle={editingTour.title || ""}
              initialDescription={editingTour.description || ""}
              initialMedia={buildInitialMedia(editingTour)}
              onSubmit={handleUpdateTour}
              onCancel={() => {
                setEditingTour(null);
                setError("");
              }}
              submitting={submitting}
            />
          </div>
        )}

        {/* Tours List */}
        {tours.length === 0 && !showForm ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 mb-4">
              <Camera className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-2">
              Nenhum tour cadastrado
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Adicione tours com fotos e vídeos do imóvel para atrair mais compradores.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Tour
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tours.map((tour) => {
              const modCfg = moderationConfig[tour.moderation_status];
              const ModIcon = modCfg.icon;
              const isDeleting = deletingId === tour.id;
              const isEditing = editingTour?.id === tour.id;
              // isResubmitting and rejectionReasons are computed inside the return below

              // Build rejection reason labels from moderation_result
              const rejectionReasons: string[] = [];
              if (tour.moderation_status === "rejected" && tour.moderation_result) {
                const failed = tour.moderation_result.failedImages || [];
                const issueSet = new Set<string>();
                failed.forEach((img) => img.issues?.forEach((i) => issueSet.add(i)));
                // Also check adminOverride reason
                if (tour.moderation_result.adminOverride?.reason) {
                  rejectionReasons.push(tour.moderation_result.adminOverride.reason);
                } else {
                  if (issueSet.has("sexual_content")) rejectionReasons.push("Conteúdo impróprio detectado");
                  if (issueSet.has("non_property")) rejectionReasons.push("Imagem não relacionada a imóveis");
                  if (issueSet.has("watermark")) rejectionReasons.push("Marca d\u2019água detectada");
                }
              }

              const isResubmitting = resubmittingId === tour.id;

              return (
                <div
                  key={tour.id}
                  className={`rounded-xl border bg-card overflow-hidden transition-opacity ${
                    isEditing ? "border-emerald-500/40" : "border-border/50"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                      <TourThumbnail media={tour.media} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">
                              {tour.title || (tour.is_original ? "Tour Original" : `Tour #${tour.id}`)}
                            </h3>
                            {tour.is_original && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5 shrink-0">
                                <Lock className="w-3 h-3" />
                                Original
                              </span>
                            )}
                          </div>
                          {tour.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {tour.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {tour.media?.length || 0} {tour.media?.length === 1 ? "mídia" : "mídias"}
                          </p>
                        </div>
                      </div>

                      {/* Moderation badge */}
                      <div className="mt-2 space-y-2">
                        <Badge
                          className={`inline-flex items-center gap-1 border text-xs ${modCfg.className}`}
                        >
                          <ModIcon className="w-3 h-3" />
                          {modCfg.label}
                        </Badge>

                        {/* Rejection reasons */}
                        {tour.moderation_status === "rejected" && rejectionReasons.length > 0 && (
                          <div className="space-y-1">
                            {rejectionReasons.map((reason, i) => (
                              <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                                <XCircle className="w-3 h-3 shrink-0" />
                                {reason}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="border-t border-border/30 px-4 py-3 flex items-center gap-2 bg-muted/10 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs flex-1"
                        onClick={() => {
                          setShowForm(false);
                          setError("");
                          setEditingTour(tour);
                        }}
                        disabled={isDeleting || isResubmitting}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Button>

                      {/* Re-submit for moderation (only for rejected non-original tours) */}
                      {tour.moderation_status === "rejected" && !tour.is_original && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          disabled={isDeleting || isResubmitting}
                          onClick={() => handleResubmitTour(tour.id)}
                        >
                          {isResubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Re-enviar
                        </Button>
                      )}

                      {!tour.is_original ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                          disabled={isDeleting || isResubmitting}
                          onClick={() => handleDeleteTour(tour.id)}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      ) : (
                        <div className="flex-none px-3 py-1.5 text-xs text-muted-foreground/40 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Bloqueado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
