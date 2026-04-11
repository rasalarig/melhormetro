"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Plus,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Property {
  id: number;
  title: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  status: string;
  is_premium: boolean;
  approved: string;
  created_at: string;
}

interface AdminPropertyListProps {
  properties: Property[];
}

export function AdminPropertyList({
  properties: initialProperties,
}: AdminPropertyListProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [togglingPremiumId, setTogglingPremiumId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-BR");

  const typeLabels: Record<string, string> = {
    terreno: "Terreno",
    terreno_condominio: "Terreno em Condomínio",
    casa: "Casa",
    casa_condominio: "Casa em Condomínio",
    apartamento: "Apto",
    comercial: "Comercial",
    rural: "Rural",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    inactive: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    sold: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const statusLabels: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    sold: "Vendido",
  };

  const approvalColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const approvalLabels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    setTogglingId(id);
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
        setConfirmDelete(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePremium = async (id: number) => {
    setTogglingPremiumId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}/premium`, { method: "PUT" });
      if (res.ok) {
        const data = await res.json();
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_premium: data.is_premium } : p))
        );
      }
    } catch (err) {
      console.error("Toggle premium failed:", err);
    } finally {
      setTogglingPremiumId(null);
    }
  };

  const handleApproval = async (id: number, approved: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, approved } : p))
        );
      }
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setApprovingId(null);
    }
  };

  if (properties.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border/50">
        <p className="text-muted-foreground text-lg mb-4">
          Nenhum imovel cadastrado ainda.
        </p>
        <Link href="/admin/cadastro">
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeiro Imovel
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <Card
          key={property.id}
          className="p-4 bg-card border-border/50 hover:border-emerald-500/20 transition-colors"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs shrink-0">
                  {typeLabels[property.type] || property.type}
                </Badge>
                <Badge
                  className={`text-xs shrink-0 ${statusColors[property.status] || ""}`}
                >
                  {statusLabels[property.status] || property.status}
                </Badge>
                {property.is_premium && (
                  <Badge className="text-xs shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Badge
                  className={`text-xs shrink-0 ${approvalColors[property.approved] || approvalColors.pending}`}
                >
                  {property.approved === "pending" && <Clock className="w-3 h-3 mr-1" />}
                  {property.approved === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                  {property.approved === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                  {approvalLabels[property.approved] || "Pendente"}
                </Badge>
              </div>
              <h3 className="font-semibold truncate">{property.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                <span>{formatPrice(property.price)}</span>
                <span className="hidden sm:inline">·</span>
                <span>{property.area}m²</span>
                <span className="hidden sm:inline">·</span>
                <span>
                  {property.city}, {property.state}
                </span>
                <span className="hidden sm:inline">·</span>
                <span>{formatDate(property.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {property.approved !== "approved" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApproval(property.id, "approved")}
                  disabled={approvingId === property.id}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  title="Aprovar imóvel"
                >
                  {approvingId === property.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
              )}
              {property.approved !== "rejected" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApproval(property.id, "rejected")}
                  disabled={approvingId === property.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Rejeitar imóvel"
                >
                  {approvingId === property.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePremium(property.id)}
                disabled={togglingPremiumId === property.id}
                className={property.is_premium ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-amber-400"}
                title={property.is_premium ? "Remover do Premium" : "Marcar como Premium"}
              >
                {togglingPremiumId === property.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className={`w-4 h-4 ${property.is_premium ? "fill-amber-400" : ""}`} />
                )}
              </Button>

              <Link href={`/imoveis/${property.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleToggleStatus(property.id, property.status)
                }
                disabled={togglingId === property.id}
                className="text-muted-foreground hover:text-emerald-400"
                title={
                  property.status === "active" ? "Desativar" : "Ativar"
                }
              >
                {togglingId === property.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : property.status === "active" ? (
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
              </Button>

              <Link href={`/admin/cadastro?edit=${property.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>

              {confirmDelete === property.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(property.id)}
                    disabled={deletingId === property.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  >
                    {deletingId === property.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(property.id)}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
