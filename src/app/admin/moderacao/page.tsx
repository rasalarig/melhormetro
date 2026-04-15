"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Shield,
  Play,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { resolveMediaUrl, isVideoUrl } from "@/lib/media-utils";

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
  adminOverride?: { status: string; reason?: string; overriddenAt?: string };
}

interface AdminTour {
  id: number;
  property_id: number;
  title: string | null;
  description: string | null;
  status: string;
  moderation_status: "pending" | "approved" | "rejected";
  moderation_result: ModerationResult | null;
  is_original: boolean;
  created_at: string;
  updated_at: string;
  property_title: string;
  property_city: string;
  property_state: string;
  seller_name: string | null;
  seller_email: string | null;
  media: TourMedia[];
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

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function TourThumbnail({ media }: { media: TourMedia[] }) {
  const first = media?.[0];
  if (!first) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
        <Camera className="w-6 h-6 text-emerald-500/40" />
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
          <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
          </div>
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Tour thumbnail" className="w-full h-full object-cover" />
  );
}

function IssueLabel({ issue }: { issue: string }) {
  const labels: Record<string, string> = {
    sexual_content: "Conteúdo impróprio",
    non_property: "Não relacionado a imóveis",
    watermark: "Marca d\u2019água",
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-400">
      <XCircle className="w-3 h-3 shrink-0" />
      {labels[issue] || issue}
    </span>
  );
}

export default function ModeracaoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tours, setTours] = useState<AdminTour[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [overriding, setOverriding] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const fetchTours = useCallback(async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tours?status=${statusFilter}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTours(data.tours || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar tours:", err);
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleOverride = async (tourId: number, status: "approved" | "rejected") => {
    setOverriding(tourId);
    try {
      const res = await fetch(`/api/admin/tours/${tourId}/moderate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moderation_status: status,
          reason: overrideReason[tourId] || undefined,
        }),
      });
      if (res.ok) {
        await fetchTours();
        setOverrideReason((prev) => {
          const next = { ...prev };
          delete next[tourId];
          return next;
        });
      }
    } catch (err) {
      console.error("Erro ao aplicar override:", err);
    } finally {
      setOverriding(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (authLoading || (loading && tours.length === 0)) {
    return (
      <div className="pt-16 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Moderação de Tours</h1>
              <p className="text-muted-foreground text-sm">{total} tour(s) encontrado(s)</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={fetchTours}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                statusFilter === f.value
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tours list */}
        {tours.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum tour encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tours.map((tour) => {
              const modCfg = moderationConfig[tour.moderation_status];
              const ModIcon = modCfg.icon;
              const isOverriding = overriding === tour.id;

              // Collect all issues from failed images
              const failedImages = tour.moderation_result?.failedImages || [];
              const allIssues = new Set<string>();
              failedImages.forEach((img) => img.issues?.forEach((i) => allIssues.add(i)));

              const hasAdminOverride = !!tour.moderation_result?.adminOverride;

              return (
                <div
                  key={tour.id}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                      <TourThumbnail media={tour.media} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {tour.title || (tour.is_original ? "Tour Original" : `Tour #${tour.id}`)}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {tour.property_title} &mdash; {tour.property_city}, {tour.property_state}
                          </p>
                          {tour.seller_name && (
                            <p className="text-xs text-muted-foreground/60">
                              Vendedor: {tour.seller_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/40 mt-0.5">
                            {formatDate(tour.created_at)}
                            {" · "}
                            {tour.media?.length || 0} mídia(s)
                          </p>
                        </div>

                        <Badge
                          className={`inline-flex items-center gap-1 border text-xs shrink-0 ${modCfg.className}`}
                        >
                          <ModIcon className="w-3 h-3" />
                          {modCfg.label}
                        </Badge>
                      </div>

                      {/* Issue details from auto-moderation */}
                      {allIssues.size > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Array.from(allIssues).map((issue) => (
                            <IssueLabel key={issue} issue={issue} />
                          ))}
                        </div>
                      )}

                      {/* Failed images detail */}
                      {failedImages.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {failedImages.map((img, i) => (
                            <div key={i} className="text-xs text-muted-foreground/60 truncate">
                              Imagem {i + 1}: {img.details?.non_property?.detected && img.details.non_property.reason}
                              {img.details?.sexual_content?.detected && img.details.sexual_content.reason}
                              {img.details?.watermark?.detected && img.details.watermark.reason}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin override info */}
                      {hasAdminOverride && (
                        <div className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 shrink-0" />
                          Override admin
                          {tour.moderation_result?.adminOverride?.reason && (
                            <span className="text-muted-foreground">
                              : {tour.moderation_result.adminOverride.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin override actions */}
                  <div className="border-t border-border/30 px-4 py-3 bg-muted/10 space-y-2">
                    <input
                      type="text"
                      placeholder="Motivo (opcional)"
                      value={overrideReason[tour.id] || ""}
                      onChange={(e) =>
                        setOverrideReason((prev) => ({ ...prev, [tour.id]: e.target.value }))
                      }
                      className="w-full text-xs rounded-lg border border-border/40 bg-background px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        disabled={isOverriding || tour.moderation_status === "approved"}
                        onClick={() => handleOverride(tour.id, "approved")}
                      >
                        {isOverriding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={isOverriding || tour.moderation_status === "rejected"}
                        onClick={() => handleOverride(tour.id, "rejected")}
                      >
                        {isOverriding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
