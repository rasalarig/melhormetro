"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  BellOff,
} from "lucide-react";

interface Alert {
  id: number;
  user_id: number;
  prompt: string;
  is_active: number;
  created_at: string;
  unseen_count: number;
  total_matches: number;
}

interface AlertMatch {
  id: number;
  alert_id: number;
  property_id: number;
  score: number;
  reasons: string[];
  seen: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  city: string;
  state: string;
  neighborhood: string | null;
  image: string | null;
}

interface AlertDetail {
  alert: Alert;
  matches: AlertMatch[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ScoreBadge({ score }: { score: number }) {
  const normalized = Math.min(score, 100);
  let colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (normalized >= 30) {
    colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  } else if (normalized >= 15) {
    colorClass = "bg-teal-500/20 text-teal-400 border-teal-500/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      Score: {normalized}
    </span>
  );
}

function MatchCard({ match }: { match: AlertMatch }) {
  const imageUrl = match.image ? `/uploads/${match.image}` : null;

  return (
    <div className="flex gap-4 p-4 rounded-lg bg-background/50 border border-border/30 hover:border-emerald-500/30 transition-colors">
      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={match.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Search className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm truncate">{match.title}</h4>
            <p className="text-xs text-muted-foreground">
              {match.city}, {match.state}
              {match.neighborhood ? ` - ${match.neighborhood}` : ""}
            </p>
          </div>
          <ScoreBadge score={match.score} />
        </div>

        <p className="text-emerald-400 font-semibold text-sm mt-1">
          {formatPrice(match.price)}
        </p>
        <p className="text-xs text-muted-foreground">
          {match.area}m&sup2; &middot; {match.type}
        </p>

        {match.reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {match.reasons.slice(0, 3).map((reason, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/imoveis/${match.property_id}`}
          className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Ver detalhes <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onToggle,
  onDelete,
  onExpand,
  expanded,
  detail,
  loadingDetail,
}: {
  alert: Alert;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
  onExpand: (id: number) => void;
  expanded: boolean;
  detail: AlertDetail | null;
  loadingDetail: boolean;
}) {
  const isActive = alert.is_active === 1;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isActive
          ? "bg-card border-emerald-500/30"
          : "bg-card/50 border-border/30 opacity-70"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bell
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? "text-emerald-500" : "text-muted-foreground"
                }`}
              />
              <p className="font-medium text-sm truncate">{alert.prompt}</p>
              {alert.unseen_count > 0 && (
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {alert.unseen_count}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Criado em {formatDate(alert.created_at)} &middot;{" "}
              {alert.total_matches}{" "}
              {alert.total_matches === 1 ? "resultado" : "resultados"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(alert.id, !isActive)}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-emerald-500 hover:bg-emerald-500/10"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
              title={isActive ? "Desativar alerta" : "Ativar alerta"}
            >
              {isActive ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => onDelete(alert.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Excluir alerta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {alert.total_matches > 0 && (
          <button
            onClick={() => onExpand(alert.id)}
            className="mt-3 ml-6 flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Ocultar resultados
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Ver resultados (
                {alert.total_matches})
              </>
            )}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/30 p-4 space-y-3">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          ) : detail && detail.matches.length > 0 ? (
            detail.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum imovel combinou com este alerta ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AlertsPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, AlertDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchAlerts();
    }
  }, [user, authLoading, router, fetchAlerts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (res.ok) {
        setPrompt("");
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error creating alert:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (alertId: number, active: boolean) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      });

      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, is_active: active ? 1 : 0 } : a
          )
        );
      }
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const handleDelete = async (alertId: number) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        if (expandedId === alertId) setExpandedId(null);
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const handleExpand = async (alertId: number) => {
    if (expandedId === alertId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(alertId);

    if (!details[alertId]) {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/alerts/${alertId}`);
        if (res.ok) {
          const data = await res.json();
          setDetails((prev) => ({ ...prev, [alertId]: data }));
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === alertId ? { ...a, unseen_count: 0 } : a
            )
          );
        }
      } catch (error) {
        console.error("Error fetching alert detail:", error);
      } finally {
        setLoadingDetail(false);
      }
    } else {
      try {
        await fetch(`/api/alerts/${alertId}`);
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, unseen_count: 0 } : a
          )
        );
      } catch {
        // ignore
      }
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="pt-24 pb-16 px-4 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-500" />
            Alertas de Busca
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Receba notificacoes quando novos imoveis combinarem com o que voce
            procura.
          </p>
        </div>

        <form onSubmit={handleCreate} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: terreno com arvores ate 200mil"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !prompt.trim()}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Criar Alerta
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              Crie alertas para ser notificado quando novos imoveis combinarem
              com o que voce procura!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onExpand={handleExpand}
                expanded={expandedId === alert.id}
                detail={details[alert.id] || null}
                loadingDetail={loadingDetail && expandedId === alert.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
