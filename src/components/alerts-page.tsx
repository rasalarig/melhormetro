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
  Target,
  X,
  Check,
  Edit2,
  MapPin,
  Tag,
  DollarSign,
  Maximize2,
  BedDouble,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: number;
  user_id: number;
  prompt: string;
  is_active: number;
  created_at: string;
  unseen_count: number;
  total_matches: number;
  profile_name: string | null;
  property_type: string | null;
  max_price: number | null;
  min_area: number | null;
  city: string | null;
  state: string | null;
  min_bedrooms: number | null;
  must_have_characteristics: string[] | null;
}

interface AlertMatch {
  id: number;
  alert_id: number;
  property_id: number;
  score: number;
  reasons: string[];
  read_at: string | null;
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

interface ProfileFormData {
  profile_name: string;
  prompt: string;
  property_type: string;
  max_price: string;
  min_area: string;
  city: string;
  state: string;
  min_bedrooms: string;
  must_have_characteristics: string[];
}

const PROPERTY_TYPES = [
  { value: "", label: "Qualquer tipo" },
  { value: "terreno", label: "Terreno" },
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "comercial", label: "Comercial" },
  { value: "rural", label: "Rural" },
  { value: "terreno_condominio", label: "Terreno em Condomínio" },
  { value: "casa_condominio", label: "Casa em Condomínio" },
];

const COMMON_CHARACTERISTICS = [
  "piscina",
  "churrasqueira",
  "garagem",
  "varanda",
  "área gourmet",
  "academia",
  "condomínio fechado",
  "portaria 24h",
  "salão de festas",
  "playground",
  "vista para mata",
  "perto do metrô",
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const EMPTY_FORM: ProfileFormData = {
  profile_name: "",
  prompt: "",
  property_type: "",
  max_price: "",
  min_area: "",
  city: "",
  state: "",
  min_bedrooms: "",
  must_have_characteristics: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatCompactPrice(price: number): string {
  if (price >= 1_000_000) {
    return `R$ ${(price / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (price >= 1_000) {
    return `R$ ${(price / 1_000).toFixed(0)}k`;
  }
  return formatPrice(price);
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const normalized = Math.min(score, 100);
  let colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (normalized >= 50) {
    colorClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  } else if (normalized >= 30) {
    colorClass = "bg-teal-500/20 text-teal-400 border-teal-500/30";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {normalized >= 50 ? "Alta" : normalized >= 30 ? "Média" : "Baixa"} relevância
    </span>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, onMarkRead }: { match: AlertMatch; onMarkRead: (id: number) => void }) {
  const imageUrl = match.image
    ? match.image.startsWith("http")
      ? match.image
      : `/uploads/${match.image}`
    : null;
  const isNew = !match.read_at;

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border transition-colors ${
        isNew
          ? "bg-emerald-500/5 border-emerald-500/30"
          : "bg-background/50 border-border/30 hover:border-border/50"
      }`}
      onClick={() => isNew && onMarkRead(match.id)}
    >
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={match.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {isNew && (
                <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wide">
                  Novo
                </span>
              )}
              <h4 className="font-medium text-sm truncate">{match.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              {match.city}, {match.state}
              {match.neighborhood ? ` · ${match.neighborhood}` : ""}
            </p>
          </div>
          <ScoreBadge score={match.score} />
        </div>

        <p className="text-emerald-400 font-semibold text-sm mt-1">
          {formatPrice(match.price)}
        </p>
        <p className="text-xs text-muted-foreground">
          {match.area}m² · {match.type}
        </p>

        {match.reasons.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
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
          className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Ver imóvel <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Profile Summary Pills ────────────────────────────────────────────────────

function ProfileSummary({ alert }: { alert: Alert }) {
  const pills: { icon: React.ReactNode; label: string }[] = [];

  if (alert.property_type) {
    const found = PROPERTY_TYPES.find((t) => t.value === alert.property_type);
    pills.push({ icon: <Tag className="w-3 h-3" />, label: found?.label ?? alert.property_type });
  }
  if (alert.max_price) {
    pills.push({ icon: <DollarSign className="w-3 h-3" />, label: `até ${formatCompactPrice(alert.max_price)}` });
  }
  if (alert.min_area) {
    pills.push({ icon: <Maximize2 className="w-3 h-3" />, label: `≥ ${alert.min_area}m²` });
  }
  if (alert.city) {
    pills.push({ icon: <MapPin className="w-3 h-3" />, label: alert.city + (alert.state ? `, ${alert.state}` : "") });
  }
  if (alert.min_bedrooms) {
    pills.push({ icon: <BedDouble className="w-3 h-3" />, label: `${alert.min_bedrooms}+ quartos` });
  }
  if (alert.must_have_characteristics && alert.must_have_characteristics.length > 0) {
    const chars = alert.must_have_characteristics.slice(0, 2).join(", ");
    const extra = alert.must_have_characteristics.length > 2 ? ` +${alert.must_have_characteristics.length - 2}` : "";
    pills.push({ icon: <Check className="w-3 h-3" />, label: chars + extra });
  }

  if (pills.length === 0 && alert.prompt) {
    return (
      <p className="text-xs text-muted-foreground italic mt-1 ml-6 truncate">
        "{alert.prompt}"
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
      {pills.map((pill, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-card border border-border/50 text-muted-foreground"
        >
          {pill.icon}
          {pill.label}
        </span>
      ))}
      {alert.prompt && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-card border border-border/50 text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          IA ativa
        </span>
      )}
    </div>
  );
}

// ─── Alert / Profile Card ─────────────────────────────────────────────────────

function AlertCard({
  alert,
  onToggle,
  onDelete,
  onExpand,
  onEdit,
  expanded,
  detail,
  loadingDetail,
  onMarkRead,
}: {
  alert: Alert;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number) => void;
  onExpand: (id: number) => void;
  onEdit: (alert: Alert) => void;
  expanded: boolean;
  detail: AlertDetail | null;
  loadingDetail: boolean;
  onMarkRead: (matchId: number) => void;
}) {
  const isActive = alert.is_active === 1;
  const displayName = alert.profile_name || alert.prompt || "Perfil sem nome";

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
              <Target
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? "text-emerald-500" : "text-muted-foreground"
                }`}
              />
              <p className="font-medium text-sm truncate">{displayName}</p>
              {alert.unseen_count > 0 && (
                <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {alert.unseen_count > 99 ? "99+" : alert.unseen_count}
                </span>
              )}
            </div>

            <ProfileSummary alert={alert} />

            <p className="text-xs text-muted-foreground mt-1.5 ml-6">
              Criado em {formatDate(alert.created_at)} ·{" "}
              {alert.total_matches}{" "}
              {alert.total_matches === 1 ? "resultado" : "resultados"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(alert)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              title="Editar perfil"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggle(alert.id, !isActive)}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-emerald-500 hover:bg-emerald-500/10"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
              title={isActive ? "Pausar perfil" : "Ativar perfil"}
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
              title="Excluir perfil"
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
              <MatchCard key={match.id} match={match} onMarkRead={onMarkRead} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum imóvel combinando ainda. Novos imóveis que se encaixem serão notificados aqui.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: ProfileFormData;
  onSave: (data: ProfileFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProfileFormData>(initial ?? EMPTY_FORM);
  const [charInput, setCharInput] = useState("");

  const set = (field: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChar = (char: string) => {
    setForm((prev) => ({
      ...prev,
      must_have_characteristics: prev.must_have_characteristics.includes(char)
        ? prev.must_have_characteristics.filter((c) => c !== char)
        : [...prev.must_have_characteristics, char],
    }));
  };

  const addCustomChar = () => {
    const trimmed = charInput.trim().toLowerCase();
    if (trimmed && !form.must_have_characteristics.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        must_have_characteristics: [...prev.must_have_characteristics, trimmed],
      }));
    }
    setCharInput("");
  };

  const removeChar = (char: string) => {
    setForm((prev) => ({
      ...prev,
      must_have_characteristics: prev.must_have_characteristics.filter((c) => c !== char),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Profile Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Nome do perfil *
        </label>
        <input
          type="text"
          value={form.profile_name}
          onChange={(e) => set("profile_name", e.target.value)}
          placeholder='Ex: "Terreno no interior de SP"'
          required
          className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors"
        />
      </div>

      {/* Description (AI search) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Descrição (busca por IA)
        </label>
        <textarea
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          placeholder='Descreva livremente o que busca. Ex: "quero um terreno plano com árvores, perto de SP, fora de condomínio"'
          rows={2}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5">
          A IA interpreta sua descrição e usa para encontrar imóveis compatíveis.
        </p>
      </div>

      {/* Structured fields — row 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tipo de imóvel
          </label>
          <select
            value={form.property_type}
            onChange={(e) => set("property_type", e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 outline-none text-sm transition-colors"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quartos mínimos
          </label>
          <input
            type="number"
            min="0"
            value={form.min_bedrooms}
            onChange={(e) => set("min_bedrooms", e.target.value)}
            placeholder="Ex: 2"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors"
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Preço máximo (R$)
          </label>
          <input
            type="number"
            min="0"
            value={form.max_price}
            onChange={(e) => set("max_price", e.target.value)}
            placeholder="Ex: 500000"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Área mínima (m²)
          </label>
          <input
            type="number"
            min="0"
            value={form.min_area}
            onChange={(e) => set("min_area", e.target.value)}
            placeholder="Ex: 100"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors"
          />
        </div>
      </div>

      {/* Row 3 — Location */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Cidade
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Ex: Atibaia"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none text-sm transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Estado
          </label>
          <select
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 outline-none text-sm transition-colors"
          >
            <option value="">-</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Must-have characteristics */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Características obrigatórias
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMMON_CHARACTERISTICS.map((char) => {
            const selected = form.must_have_characteristics.includes(char);
            return (
              <button
                key={char}
                type="button"
                onClick={() => toggleChar(char)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selected
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-card border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {selected && <Check className="inline w-2.5 h-2.5 mr-0.5" />}
                {char}
              </button>
            );
          })}
        </div>

        {/* Custom characteristic */}
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={charInput}
            onChange={(e) => setCharInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomChar();
              }
            }}
            placeholder="Adicionar outra característica..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border/50 focus:border-emerald-500/50 outline-none text-xs transition-colors"
          />
          <button
            type="button"
            onClick={addCustomChar}
            disabled={!charInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-card border border-border/50 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            Adicionar
          </button>
        </div>

        {/* Selected customs (not in common list) */}
        {form.must_have_characteristics
          .filter((c) => !COMMON_CHARACTERISTICS.includes(c))
          .length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.must_have_characteristics
              .filter((c) => !COMMON_CHARACTERISTICS.includes(c))
              .map((char) => (
                <span
                  key={char}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                >
                  {char}
                  <button
                    type="button"
                    onClick={() => removeChar(char)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || !form.profile_name.trim()}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saving ? "Salvando..." : "Salvar Perfil"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertsPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
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

  const handleSave = async (formData: ProfileFormData) => {
    setSaving(true);
    try {
      const payload = {
        profile_name: formData.profile_name.trim() || undefined,
        prompt: formData.prompt.trim() || undefined,
        property_type: formData.property_type || undefined,
        max_price: formData.max_price ? Number(formData.max_price) : undefined,
        min_area: formData.min_area ? Number(formData.min_area) : undefined,
        city: formData.city.trim() || undefined,
        state: formData.state || undefined,
        min_bedrooms: formData.min_bedrooms ? Number(formData.min_bedrooms) : undefined,
        must_have_characteristics:
          formData.must_have_characteristics.length > 0
            ? formData.must_have_characteristics
            : undefined,
      };

      if (editingAlert) {
        // Update existing
        const res = await fetch(`/api/alerts/${editingAlert.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setEditingAlert(null);
          setShowForm(false);
          await fetchAlerts();
        }
      } else {
        // Create new
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowForm(false);
          await fetchAlerts();
        }
      }
    } catch (error) {
      console.error("Error saving alert:", error);
    } finally {
      setSaving(false);
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
        if (editingAlert?.id === alertId) {
          setEditingAlert(null);
          setShowForm(false);
        }
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
      // Already loaded — mark as seen via the GET endpoint
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

  const handleMarkRead = async (matchId: number) => {
    try {
      await fetch("/api/alerts/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_ids: [matchId] }),
      });
      // Update detail state optimistically
      setDetails((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const detail = next[Number(key)];
          if (detail) {
            next[Number(key)] = {
              ...detail,
              matches: detail.matches.map((m) =>
                m.id === matchId ? { ...m, read_at: new Date().toISOString() } : m
              ),
            };
          }
        }
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  const getEditInitialForm = (alert: Alert): ProfileFormData => ({
    profile_name: alert.profile_name ?? "",
    prompt: alert.prompt ?? "",
    property_type: alert.property_type ?? "",
    max_price: alert.max_price != null ? String(alert.max_price) : "",
    min_area: alert.min_area != null ? String(alert.min_area) : "",
    city: alert.city ?? "",
    state: alert.state ?? "",
    min_bedrooms: alert.min_bedrooms != null ? String(alert.min_bedrooms) : "",
    must_have_characteristics: alert.must_have_characteristics ?? [],
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="pt-16 pb-16 px-4 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Meu Perfil de Busca
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Descreva o que você procura uma vez — seremos notificados quando novos imóveis compatíveis forem cadastrados.
            </p>
          </div>

          {!showForm && (
            <button
              onClick={() => {
                setEditingAlert(null);
                setShowForm(true);
              }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo perfil
            </button>
          )}
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              {editingAlert ? "Editar Perfil de Interesse" : "Novo Perfil de Interesse"}
            </h2>
            <ProfileForm
              initial={editingAlert ? getEditInitialForm(editingAlert) : undefined}
              onSave={handleSave}
              onCancel={handleCancelForm}
              saving={saving}
            />
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-medium text-foreground/70 mb-1">
              Nenhum perfil de busca criado ainda.
            </p>
            <p className="text-sm text-muted-foreground">
              Crie um perfil para ser avisado quando novos imóveis combinarem com o que você procura.
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Criar meu primeiro perfil
              </button>
            )}
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
                onEdit={handleEdit}
                expanded={expandedId === alert.id}
                detail={details[alert.id] || null}
                loadingDetail={loadingDetail && expandedId === alert.id}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
