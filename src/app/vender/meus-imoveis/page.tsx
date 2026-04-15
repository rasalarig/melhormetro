"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Eye,
  Users,
  Loader2,
  Home,
  ExternalLink,
  ChevronDown,
  Trash2,
  Pencil,
  ThermometerSun,
  ArrowRight,
  Play,
  Sparkles,
  Copy,
  Check,
  X,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { isVideoUrl, resolveMediaUrl } from "@/lib/media-utils";

interface PropertyImage {
  id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string;
  status: "active" | "inactive" | "sold";
  images: PropertyImage[];
  engagement_count: number;
  interested_users_count: number;
  created_at: string;
}

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500", textColor: "text-emerald-400", bgBadge: "bg-emerald-500/10 border-emerald-500/20" },
  inactive: { label: "Inativo", color: "bg-yellow-500", textColor: "text-yellow-400", bgBadge: "bg-yellow-500/10 border-yellow-500/20" },
  sold: { label: "Vendido", color: "bg-red-500", textColor: "text-red-400", bgBadge: "bg-red-500/10 border-red-500/20" },
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

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function getCoverImage(images: PropertyImage[]): string | null {
  if (!images || images.length === 0) return null;
  const cover = images.find((img) => img.is_cover === 1);
  return (cover || images[0]).filename;
}

function ScriptSection({
  title,
  content,
  section,
  copiedSection,
  onCopy,
}: {
  title: string;
  content: string;
  section: string;
  copiedSection: string | null;
  onCopy: (text: string, section: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 bg-muted/20">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <button
          onClick={() => onCopy(content, section)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          {copiedSection === section ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copiar
            </>
          )}
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

export default function MeusImoveisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [adScriptPropertyId, setAdScriptPropertyId] = useState<number | null>(null);
  const [adScriptLoading, setAdScriptLoading] = useState(false);
  const [adScript, setAdScript] = useState<{
    target_audience: string;
    headline: string;
    portal_description: string;
    social_media_caption: string;
    video_script: string;
  } | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/sellers/properties");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 404) {
        // Seller not found - that's ok, just show empty
        setProperties([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProperties(data.properties || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchProperties();
  }, [user, authLoading, router, fetchProperties]);

  const updateStatus = async (propertyId: number, newStatus: string) => {
    setUpdatingId(propertyId);
    setOpenDropdown(null);
    try {
      const res = await fetch(`/api/sellers/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchProperties();
      }
    } catch {
      // Silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteProperty = async (propertyId: number) => {
    if (!confirm("Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.")) {
      return;
    }
    setDeletingId(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProperties();
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const generateAdScript = async (property: Property) => {
    setAdScriptPropertyId(property.id);
    setAdScriptLoading(true);
    setAdScript(null);
    try {
      const chars = property.description ? [] : [];
      const res = await fetch("/api/ai/generate-ad-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: property.title,
          description: property.description,
          type: property.type,
          price: property.price,
          area: property.area,
          city: property.city,
          state: property.state,
          neighborhood: property.neighborhood || "",
          characteristics: chars,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdScript(data);
      }
    } catch {
      // ignore
    } finally {
      setAdScriptLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // ignore
    }
  };

  const closeAdScript = () => {
    setAdScriptPropertyId(null);
    setAdScript(null);
    setAdScriptLoading(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openDropdown]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const stats = {
    total: properties.length,
    active: properties.filter((p) => p.status === "active").length,
    inactive: properties.filter((p) => p.status === "inactive").length,
    sold: properties.filter((p) => p.status === "sold").length,
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto px-4 pt-16 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Imóveis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie seus imóveis anunciados
            </p>
          </div>
          <Link href="/vender/imovel">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Novo Imóvel
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs text-emerald-400 uppercase tracking-wider">Ativos</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs text-yellow-400 uppercase tracking-wider">Inativos</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.inactive}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-xs text-red-400 uppercase tracking-wider">Vendidos</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.sold}</p>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 mb-4">
              <Home className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhum imóvel cadastrado
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Você ainda não possui imóveis cadastrados. Comece agora e alcance milhares de compradores.
            </p>
            <Link href="/vender/imovel">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Imóvel
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => {
              const coverUrl = getCoverImage(property.images);
              const config = statusConfig[property.status];
              const isUpdating = updatingId === property.id;
              const isDeleting = deletingId === property.id;

              return (
                <div
                  key={property.id}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 w-full">
                    {coverUrl && isVideoUrl(resolveMediaUrl(coverUrl)) ? (
                      <div className="relative w-full h-full">
                        <video
                          src={`${resolveMediaUrl(coverUrl)}#t=0.1`}
                          className="w-full h-full object-cover"
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
                    ) : coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(coverUrl)}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-emerald-500/40" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.bgBadge} ${config.textColor}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Title & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {property.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {property.city}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                      >
                        {typeLabels[property.type] || property.type}
                      </Badge>
                    </div>

                    {/* Price & Area */}
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-emerald-400">
                        {formatPrice(property.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {property.area} m2
                      </span>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {property.engagement_count} visualizações
                      </span>
                      <Link
                        href={`/vender/leads?property=${property.id}`}
                        className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {property.interested_users_count} interessados
                      </Link>
                    </div>

                    {/* AI Script Button */}
                    <button
                      onClick={() => generateAdScript(property)}
                      disabled={adScriptLoading && adScriptPropertyId === property.id}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      {adScriptLoading && adScriptPropertyId === property.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {adScriptLoading && adScriptPropertyId === property.id ? "Gerando roteiro..." : "Gerar Roteiro de Anúncio com IA"}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link href={`/imoveis/${property.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Ver
                        </Button>
                      </Link>

                      <Link href={`/vender/imovel/${property.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Editar
                        </Button>
                      </Link>

                      <Link href={`/vender/imovel/${property.id}/tours`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/20"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5" />
                          Tours
                        </Button>
                      </Link>

                      {/* Status Dropdown */}
                      <div className="relative flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg text-xs"
                          disabled={isUpdating}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === property.id ? null : property.id
                            );
                          }}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              Status
                              <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            </>
                          )}
                        </Button>

                        {openDropdown === property.id && (
                          <div className="absolute bottom-full mb-1 left-0 right-0 z-50 rounded-lg border border-border/50 bg-card shadow-xl overflow-hidden">
                            {property.status !== "active" && (
                              <button
                                onClick={() => updateStatus(property.id, "active")}
                                className="w-full px-3 py-2 text-xs text-left hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                              >
                                Ativar
                              </button>
                            )}
                            {property.status !== "inactive" && (
                              <button
                                onClick={() => updateStatus(property.id, "inactive")}
                                className="w-full px-3 py-2 text-xs text-left hover:bg-yellow-500/10 text-yellow-400 transition-colors"
                              >
                                Desativar
                              </button>
                            )}
                            {property.status !== "sold" && (
                              <button
                                onClick={() => updateStatus(property.id, "sold")}
                                className="w-full px-3 py-2 text-xs text-left hover:bg-red-500/10 text-red-400 transition-colors"
                              >
                                Marcar Vendido
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                        disabled={isDeleting}
                        onClick={() => deleteProperty(property.id)}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leads Link Card */}
        <Link href="/vender/leads" className="block mt-6">
          <div className="rounded-xl border border-border/50 bg-card p-5 flex items-center justify-between hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
                <ThermometerSun className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Ver Leads & Interessados</p>
                <p className="text-sm text-muted-foreground">
                  Acompanhe quem está interessado nos seus imóveis
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          </div>
        </Link>

        {/* Ad Script Modal */}
        {adScriptPropertyId && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-border/50 bg-card shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Roteiro de Anúncio</h2>
                    <p className="text-xs text-muted-foreground">Gerado por IA especialista em marketing imobiliário</p>
                  </div>
                </div>
                <button
                  onClick={closeAdScript}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {adScriptLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    <p className="text-sm text-muted-foreground">Analisando seu imóvel e gerando roteiro personalizado...</p>
                  </div>
                ) : adScript ? (
                  <>
                    {/* Target Audience */}
                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Público-alvo</p>
                      <p className="text-sm text-foreground">{adScript.target_audience}</p>
                    </div>

                    {/* Headline */}
                    <ScriptSection
                      title="Título de Impacto"
                      content={adScript.headline}
                      section="headline"
                      copiedSection={copiedSection}
                      onCopy={copyToClipboard}
                    />

                    {/* Portal Description */}
                    <ScriptSection
                      title="Descrição para Portais (OLX, ZAP, VivaReal)"
                      content={adScript.portal_description}
                      section="portal"
                      copiedSection={copiedSection}
                      onCopy={copyToClipboard}
                    />

                    {/* Social Media */}
                    <ScriptSection
                      title="Post para Instagram / Facebook"
                      content={adScript.social_media_caption}
                      section="social"
                      copiedSection={copiedSection}
                      onCopy={copyToClipboard}
                    />

                    {/* Video Script */}
                    <ScriptSection
                      title="Roteiro de Vídeo (Reels / TikTok)"
                      content={adScript.video_script}
                      section="video"
                      copiedSection={copiedSection}
                      onCopy={copyToClipboard}
                    />
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Erro ao gerar roteiro. Tente novamente.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
