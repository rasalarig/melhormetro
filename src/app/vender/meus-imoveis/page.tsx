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

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500", textColor: "text-emerald-400", bgBadge: "bg-emerald-500/10 border-emerald-500/20" },
  inactive: { label: "Inativo", color: "bg-yellow-500", textColor: "text-yellow-400", bgBadge: "bg-yellow-500/10 border-yellow-500/20" },
  sold: { label: "Vendido", color: "bg-red-500", textColor: "text-red-400", bgBadge: "bg-red-500/10 border-red-500/20" },
};

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
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {property.interested_users_count} interessados
                      </span>
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
      </div>
    </div>
  );
}
