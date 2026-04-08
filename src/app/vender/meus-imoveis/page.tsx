"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Flame,
  MessageCircle,
  ThermometerSun,
  Filter,
  Heart,
  Share2,
  FileText,
  Phone,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

interface InterestedUser {
  user_id: number;
  property_id: number;
  user_name: string;
  user_email: string;
  avatar_url: string | null;
  property_title: string;
  score: number;
  temperature: string;
  interactions: {
    view_half: number;
    view_complete: number;
    like: number;
    share: number;
    click_details: number;
    click_whatsapp: number;
    click_buy: number;
    total: number;
  };
  last_interaction: string;
}

interface InterestedStats {
  total: number;
  frio: number;
  morno: number;
  quente: number;
  convertido: number;
}

const temperatureConfig: Record<string, { label: string; color: string; bgColor: string; iconColor: string }> = {
  frio: { label: "Frio", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20", iconColor: "text-blue-400" },
  morno: { label: "Morno", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20", iconColor: "text-yellow-400" },
  quente: { label: "Quente", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20", iconColor: "text-orange-400" },
  convertido: { label: "Convertido", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20", iconColor: "text-red-400" },
};

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `ha ${diffMinutes} min`;
  if (diffHours < 24) return `ha ${diffHours}h`;
  if (diffDays === 1) return "ha 1 dia";
  if (diffDays < 30) return `ha ${diffDays} dias`;
  if (diffDays < 365) return `ha ${Math.floor(diffDays / 30)} meses`;
  return `ha ${Math.floor(diffDays / 365)} anos`;
}

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500", textColor: "text-emerald-400", bgBadge: "bg-emerald-500/10 border-emerald-500/20" },
  inactive: { label: "Inativo", color: "bg-yellow-500", textColor: "text-yellow-400", bgBadge: "bg-yellow-500/10 border-yellow-500/20" },
  sold: { label: "Vendido", color: "bg-red-500", textColor: "text-red-400", bgBadge: "bg-red-500/10 border-red-500/20" },
};

const scoreWeights: Record<string, number> = {
  view_half: 10,
  view_complete: 25,
  like: 15,
  share: 20,
  click_details: 30,
  click_whatsapp: 35,
  click_buy: 50,
};

const actionConfig: { key: string; label: string; icon: typeof Eye; iconColor: string }[] = [
  { key: "view_half", label: "Visualizou parcialmente", icon: Eye, iconColor: "text-blue-400" },
  { key: "view_complete", label: "Visualizou completo", icon: Eye, iconColor: "text-indigo-400" },
  { key: "like", label: "Curtiu", icon: Heart, iconColor: "text-pink-400" },
  { key: "share", label: "Compartilhou", icon: Share2, iconColor: "text-green-400" },
  { key: "click_details", label: "Viu detalhes", icon: FileText, iconColor: "text-cyan-400" },
  { key: "click_whatsapp", label: "Clicou WhatsApp", icon: Phone, iconColor: "text-emerald-400" },
  { key: "click_buy", label: "Clicou Comprar", icon: ShoppingCart, iconColor: "text-orange-400" },
];

const temperatureExplanation: Record<string, string> = {
  frio: "Score abaixo de 20 pontos",
  morno: "Score entre 20 e 39 pontos",
  quente: "Score entre 40 e 59 pontos",
  convertido: "Score acima de 60 pontos",
};

function EngagementDetailModal({ user, onClose }: { user: InterestedUser; onClose: () => void }) {
  const tempCfg = temperatureConfig[user.temperature] || temperatureConfig.frio;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border/50 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/50 px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{user.user_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.property_title}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Actions List */}
        <div className="px-5 py-4 space-y-3">
          {actionConfig.map(({ key, label, icon: Icon, iconColor }) => {
            const count = user.interactions[key as keyof typeof user.interactions] as number;
            if (!count || count <= 0) return null;
            const weight = scoreWeights[key];
            const total = weight * count;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {weight}pts cada x {count} {count === 1 ? "vez" : "vezes"}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground shrink-0">
                  {total} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer: Total + Temperature */}
        <div className="border-t border-border/50 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">{user.score} pts</span>
          </div>
          <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${tempCfg.bgColor}`}>
            <Flame className={`w-4 h-4 ${tempCfg.iconColor}`} />
            <span className={`text-sm font-semibold ${tempCfg.color}`}>{tempCfg.label}</span>
            <span className="text-xs text-muted-foreground">
              — {temperatureExplanation[user.temperature] || ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const typeLabels: Record<string, string> = {
  terreno: "Terreno",
  casa: "Casa",
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

export default function MeusImoveisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [interested, setInterested] = useState<InterestedUser[]>([]);
  const [interestedStats, setInterestedStats] = useState<InterestedStats>({ total: 0, frio: 0, morno: 0, quente: 0, convertido: 0 });
  const [interestedLoading, setInterestedLoading] = useState(true);
  const [temperatureFilter, setTemperatureFilter] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const interestedRef = useRef<HTMLDivElement>(null);
  const [detailUser, setDetailUser] = useState<InterestedUser | null>(null);

  const fetchInterested = useCallback(async (tempFilter?: string | null, propFilter?: string | null) => {
    try {
      const params = new URLSearchParams();
      if (tempFilter) params.set("temperature", tempFilter);
      if (propFilter) params.set("property_id", propFilter);
      const qs = params.toString();
      const res = await fetch(`/api/sellers/interested${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setInterested(data.interested || []);
        setInterestedStats(data.stats || { total: 0, frio: 0, morno: 0, quente: 0, convertido: 0 });
      }
    } catch {
      // Silently fail
    } finally {
      setInterestedLoading(false);
    }
  }, []);

  const scrollToInterested = useCallback((propId?: number) => {
    if (propId) {
      setPropertyFilter(String(propId));
      setTemperatureFilter(null);
      fetchInterested(null, String(propId));
    }
    setTimeout(() => {
      interestedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [fetchInterested]);

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
    fetchInterested();
  }, [user, authLoading, router, fetchProperties, fetchInterested]);

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
    if (!confirm("Tem certeza que deseja excluir este imovel? Esta acao nao pode ser desfeita.")) {
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
      <div className="container mx-auto px-4 pt-24 md:pt-24 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Imoveis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie seus imoveis anunciados
            </p>
          </div>
          <Link href="/vender/imovel">
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Novo Imovel
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
              Nenhum imovel cadastrado
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Voce ainda nao possui imoveis cadastrados. Comece agora e alcance milhares de compradores.
            </p>
            <Link href="/vender/imovel">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Imovel
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
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
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
                        {property.engagement_count} visualizacoes
                      </span>
                      <button
                        onClick={() => scrollToInterested(property.id)}
                        className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {property.interested_users_count} interessados
                      </button>
                    </div>

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

        {/* Possiveis Interessados Section */}
        <div ref={interestedRef} className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10">
                <ThermometerSun className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Possiveis Interessados</h2>
                <p className="text-sm text-muted-foreground">
                  {interestedStats.total} {interestedStats.total === 1 ? "pessoa" : "pessoas"} interagiram com seus imoveis
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Temperature Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={temperatureFilter === null ? "default" : "outline"}
                size="sm"
                className={`rounded-lg text-xs ${temperatureFilter === null ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                onClick={() => {
                  setTemperatureFilter(null);
                  fetchInterested(null, propertyFilter);
                }}
              >
                Todos ({interestedStats.total})
              </Button>
              {(["frio", "morno", "quente", "convertido"] as const).map((temp) => {
                const cfg = temperatureConfig[temp];
                return (
                  <Button
                    key={temp}
                    variant={temperatureFilter === temp ? "default" : "outline"}
                    size="sm"
                    className={`rounded-lg text-xs ${
                      temperatureFilter === temp
                        ? `${cfg.bgColor} ${cfg.color} border`
                        : ""
                    }`}
                    onClick={() => {
                      const newTemp = temperatureFilter === temp ? null : temp;
                      setTemperatureFilter(newTemp);
                      fetchInterested(newTemp, propertyFilter);
                    }}
                  >
                    <Flame className={`w-3 h-3 mr-1 ${cfg.iconColor}`} />
                    {cfg.label} ({interestedStats[temp]})
                  </Button>
                );
              })}
            </div>

            {/* Property Filter Dropdown */}
            {properties.length > 0 && (
              <div className="relative">
                <select
                  value={propertyFilter || ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setPropertyFilter(val);
                    fetchInterested(temperatureFilter, val);
                  }}
                  className="appearance-none rounded-lg border border-border/50 bg-card text-foreground text-xs px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Todos os imoveis</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          {/* Interested Users Cards */}
          {interestedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : interested.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 mb-3">
                <Users className="w-8 h-8 text-emerald-500/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Nenhum interessado encontrado
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Quando usuarios interagirem com seus imoveis, eles aparecerao aqui com uma pontuacao de interesse.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interested.map((item, idx) => {
                const tempCfg = temperatureConfig[item.temperature] || temperatureConfig.frio;
                const initial = item.user_name ? item.user_name.charAt(0).toUpperCase() : "?";

                return (
                  <div
                    key={`${item.user_id}-${item.property_id}-${idx}`}
                    className="rounded-xl border border-border/50 bg-card p-4 flex items-start gap-3"
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {item.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt={item.user_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center text-sm font-semibold text-emerald-400">
                          {initial}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {item.user_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.user_email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setDetailUser(item)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${tempCfg.bgColor} ${tempCfg.color}`}
                            title="Ver detalhes de engajamento"
                          >
                            <Flame className={`w-3 h-3 ${tempCfg.iconColor}`} />
                            {tempCfg.label}
                          </button>
                          <span className="text-xs font-bold text-muted-foreground" title="Pontuacao de interesse baseada nas interacoes">
                            {item.score} pts
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="truncate" title={item.property_title}>
                          {item.property_title}
                        </span>
                        <span className="shrink-0">
                          {formatRelativeDate(item.last_interaction)}
                        </span>
                      </div>

                      <div className="mt-2">
                        <Link href={`/mensagens?user=${item.user_id}&property=${item.property_id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs h-7 px-3 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Conversar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Detail Modal */}
      {detailUser && (
        <EngagementDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  );
}
