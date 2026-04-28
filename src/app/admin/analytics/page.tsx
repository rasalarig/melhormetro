"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
}

interface TimePoint {
  x: string;
  y: number;
}

interface PageviewsData {
  pageviews: TimePoint[];
  sessions: TimePoint[];
}

interface MetricItem {
  x: string;
  y: number;
}

// ─── Period config ─────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "Hoje", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString("pt-BR");
}

function fmtPct(n: number | undefined | null) {
  if (n == null || isNaN(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
}

function fmtTime(seconds: number | undefined | null) {
  if (!seconds || isNaN(seconds)) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function changeLabel(change: number | undefined | null) {
  if (change == null || isNaN(change)) return "+0";
  const sign = change > 0 ? "+" : "";
  return `${sign}${fmt(change)}`;
}

function shortPath(path: string) {
  if (!path) return "(direto)";
  if (path.length > 40) return path.slice(0, 37) + "…";
  return path;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  suffix = "",
}: {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  const positive = change >= 0;
  return (
    <Card className={`p-4 bg-card border-border/50 hover:border-${color}-500/30 transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 text-${color}-400`} />
        </div>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            positive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {changeLabel(change)}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
          {value}
          {suffix && <span className="text-lg font-normal text-muted-foreground ml-1">{suffix}</span>}
        </div>
        <div className="text-sm text-muted-foreground mt-1 font-medium">{label}</div>
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4 bg-card border-border/50 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-lg bg-muted/40" />
        <div className="h-4 w-12 rounded bg-muted/40" />
      </div>
      <div className="mt-3">
        <div className="h-7 w-20 rounded bg-muted/40 mb-1" />
        <div className="h-3 w-16 rounded bg-muted/40" />
      </div>
    </Card>
  );
}

function MiniBarChart({ items, color }: { items: MetricItem[]; color: string }) {
  const max = Math.max(...items.map((i) => i.y), 1);
  return (
    <div className="space-y-2">
      {items.slice(0, 6).map((item) => {
        const pct = Math.max((item.y / max) * 100, 2);
        return (
          <div key={item.x} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground truncate w-24 shrink-0 text-xs">{item.x || "(outro)"}</span>
            <div className="flex-1 h-5 bg-muted/20 rounded overflow-hidden">
              <div
                className={`h-full bg-${color}-500/70 rounded transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{fmt(item.y)}</span>
          </div>
        );
      })}
    </div>
  );
}

function MetricTable({ items, label }: { items: MetricItem[]; label: string }) {
  const total = items.reduce((s, i) => s + i.y, 0) || 1;
  return (
    <div className="space-y-1.5">
      {items.slice(0, 8).map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm group">
          <span className="flex-1 text-xs truncate text-foreground/80" title={item.x}>
            {label === "path" ? shortPath(item.x) : item.x || "(direto)"}
          </span>
          <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/60 rounded-full"
              style={{ width: `${Math.max((item.y / total) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{fmt(item.y)}</span>
        </div>
      ))}
    </div>
  );
}

function PageviewsChart({ data, days }: { data: PageviewsData; days: number }) {
  const rawPv = data.pageviews ?? [];
  const rawSess = data.sessions ?? [];

  // Use API data directly — no time-slot filling needed
  // Just combine pageviews and sessions by index
  const combined = rawPv.map((pv, i) => ({
    x: pv.x,
    pv: pv.y,
    sess: rawSess[i]?.y ?? 0,
  }));

  if (combined.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Sem dados para o período
      </div>
    );
  }

  const maxY = Math.max(...combined.map((p) => p.pv), 1);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (days <= 1) {
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (days <= 7) {
      return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
    }
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          Visualizações
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" />
          Visitantes
        </span>
      </div>
      {/* Bars */}
      <div className="flex items-end gap-1 h-44 w-full">
        {combined.map((item, idx) => {
          const pvH = (item.pv / maxY) * 100;
          const svH = (item.sess / maxY) * 100;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group"
              title={`${formatDateLabel(item.x)}: ${fmt(item.pv)} views, ${fmt(item.sess)} visitantes`}
            >
              {/* Value on top */}
              <div className="text-[9px] text-muted-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.pv}
              </div>
              {/* Bars container */}
              <div className="w-full flex items-end gap-0.5 flex-1">
                {/* Pageviews bar */}
                <div
                  className="flex-1 bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                  style={{ height: `${Math.max(pvH, 3)}%` }}
                />
                {/* Sessions bar */}
                <div
                  className="flex-1 bg-teal-400 rounded-t transition-all group-hover:bg-teal-300"
                  style={{ height: `${Math.max(svH, 3)}%` }}
                />
              </div>
              {/* Label */}
              <div className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">
                {formatDateLabel(item.x)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Device icon helper ────────────────────────────────────────────────────────

function DeviceIcon({ name }: { name: string }) {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("mobile") || lower.includes("phone")) return <Smartphone className="w-3 h-3" />;
  if (lower.includes("tablet")) return <Tablet className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState(2); // index into PERIODS (default: 30 dias)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [activeVisitors, setActiveVisitors] = useState<number | null>(null);
  const [pageviewsData, setPageviewsData] = useState<PageviewsData | null>(null);
  const [pages, setPages] = useState<MetricItem[]>([]);
  const [referrers, setReferrers] = useState<MetricItem[]>([]);
  const [cities, setCities] = useState<MetricItem[]>([]);
  const [devices, setDevices] = useState<MetricItem[]>([]);
  const [browsers, setBrowsers] = useState<MetricItem[]>([]);
  const [os, setOs] = useState<MetricItem[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const getRange = useCallback(() => {
    const days = PERIODS[period].days;
    const endAt = Date.now();
    const startAt = endAt - days * 24 * 60 * 60 * 1000;
    return { startAt, endAt };
  }, [period]);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    const { startAt, endAt } = getRange();
    const days = PERIODS[period].days;
    const unit = days <= 1 ? "hour" : "day";
    const qs = `startAt=${startAt}&endAt=${endAt}`;

    try {
      const [
        statsRes,
        pvRes,
        pagesRes,
        refRes,
        citiesRes,
        devicesRes,
        browsersRes,
        osRes,
      ] = await Promise.all([
        fetch(`/api/admin/analytics?type=stats&${qs}`),
        fetch(`/api/admin/analytics?type=pageviews&${qs}&unit=${unit}`),
        fetch(`/api/admin/analytics?type=pages&${qs}`),
        fetch(`/api/admin/analytics?type=referrers&${qs}`),
        fetch(`/api/admin/analytics?type=cities&${qs}`),
        fetch(`/api/admin/analytics?type=devices&${qs}`),
        fetch(`/api/admin/analytics?type=browsers&${qs}`),
        fetch(`/api/admin/analytics?type=os&${qs}`),
      ]);

      // Check for not-configured
      if (statsRes.status === 503) {
        const body = await statsRes.json();
        setNotConfigured(true);
        setError(body.error ?? "Analytics não configurado.");
        setLoading(false);
        return;
      }

      if (!statsRes.ok) {
        setError("Erro ao carregar analytics.");
        setLoading(false);
        return;
      }

      const [
        statsData,
        pvData,
        pagesData,
        refData,
        citiesData,
        devicesData,
        browsersData,
        osData,
      ] = await Promise.all([
        statsRes.json(),
        pvRes.ok ? pvRes.json() : { pageviews: [], sessions: [] },
        pagesRes.ok ? pagesRes.json() : [],
        refRes.ok ? refRes.json() : [],
        citiesRes.ok ? citiesRes.json() : [],
        devicesRes.ok ? devicesRes.json() : [],
        browsersRes.ok ? browsersRes.json() : [],
        osRes.ok ? osRes.json() : [],
      ]);

      setStats(statsData);
      setPageviewsData(pvData);
      setPages(Array.isArray(pagesData) ? pagesData : []);
      setReferrers(Array.isArray(refData) ? refData : []);
      setCities(Array.isArray(citiesData) ? citiesData : []);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setBrowsers(Array.isArray(browsersData) ? browsersData : []);
      setOs(Array.isArray(osData) ? osData : []);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Erro de conexão ao carregar analytics.");
    } finally {
      setLoading(false);
    }
  }, [user, getRange, period]);

  const fetchActive = useCallback(async () => {
    if (!user?.is_admin) return;
    try {
      const res = await fetch("/api/admin/analytics?type=active");
      if (res.ok) {
        const data = await res.json();
        setActiveVisitors(data?.visitors ?? 0);
      }
    } catch {
      // silent
    }
  }, [user]);

  // Initial load + period changes
  useEffect(() => {
    if (user?.is_admin) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  // Active visitors poll every 30s
  useEffect(() => {
    if (!user?.is_admin) return;
    fetchActive();
    const interval = setInterval(fetchActive, 30_000);
    return () => clearInterval(interval);
  }, [user, fetchActive]);

  if (authLoading) {
    return (
      <div className="pt-16 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  const days = PERIODS[period].days;
  type StatField = "pageviews" | "visitors" | "visits" | "bounces" | "totaltime";
  const sv = (field: StatField) => (typeof stats?.[field] === "number" ? stats[field] : 0) as number;
  const sc = (field: StatField) => (typeof stats?.comparison?.[field] === "number" ? stats.comparison[field] : 0) as number;
  const bounceRate = sv("visits") > 0 ? (sv("bounces") / sv("visits")) * 100 : 0;
  const bounceRateChange = sc("bounces") - sc("visits");
  const avgTime = sv("visits") > 0 ? sv("totaltime") / sv("visits") : 0;

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
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground text-sm">Estatísticas do site via Umami</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Not configured error */}
        {notConfigured && (
          <Card className="p-6 border-amber-500/30 bg-amber-500/5 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-400 mb-1">Analytics não configurado</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Gere uma API Key em{" "}
                  <a
                    href="https://cloud.umami.is/settings/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-cyan-400"
                  >
                    cloud.umami.is/settings/api-keys
                  </a>{" "}
                  e adicione <code className="bg-muted px-1 rounded text-xs">UMAMI_API_KEY</code> e{" "}
                  <code className="bg-muted px-1 rounded text-xs">UMAMI_WEBSITE_ID</code> no <code className="bg-muted px-1 rounded text-xs">.env.local</code>.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Generic error */}
        {error && !notConfigured && (
          <Card className="p-4 border-red-500/30 bg-red-500/5 mb-6">
            <div className="flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </Card>
        )}

        {!notConfigured && (
          <>
            {/* Row 1: Period selector + Active visitors */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
                {PERIODS.map((p, idx) => (
                  <button
                    key={p.label}
                    onClick={() => setPeriod(idx)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      period === idx
                        ? "bg-emerald-500 text-white shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-sm text-emerald-400 font-medium">
                  {activeVisitors !== null ? fmt(activeVisitors) : "—"} ativo
                  {activeVisitors !== 1 ? "s" : ""} agora
                </span>
              </div>
            </div>

            {/* Row 2: KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : stats ? (
                <>
                  <KpiCard
                    label="Visitantes"
                    value={fmt(sv("visitors"))}
                    change={sc("visitors")}
                    icon={Users}
                    color="emerald"
                  />
                  <KpiCard
                    label="Visualizações"
                    value={fmt(sv("pageviews"))}
                    change={sc("pageviews")}
                    icon={Eye}
                    color="teal"
                  />
                  <KpiCard
                    label="Visitas"
                    value={fmt(sv("visits"))}
                    change={sc("visits")}
                    icon={MousePointerClick}
                    color="cyan"
                  />
                  <KpiCard
                    label="Taxa de Rejeição"
                    value={fmtPct(bounceRate)}
                    change={bounceRateChange}
                    icon={TrendingDown}
                    color="violet"
                  />
                </>
              ) : null}
            </div>

            {/* Avg time badge */}
            {!loading && stats && (
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg">
                  Tempo médio por visita:{" "}
                  <span className="font-semibold text-foreground">{fmtTime(avgTime)}</span>
                </div>
              </div>
            )}

            {/* Row 3: Pageviews chart */}
            <Card className="p-4 mb-6 bg-card border-border/50">
              <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
                Pageviews — últimos {days === 1 ? "24h" : `${days} dias`}
              </h2>
              {loading ? (
                <div className="h-40 bg-muted/20 rounded animate-pulse" />
              ) : pageviewsData && (pageviewsData.pageviews?.length > 0 || pageviewsData.sessions?.length > 0) ? (
                <PageviewsChart data={pageviewsData} days={days} />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                  <span>Sem dados disponíveis</span>
                  <span className="text-[10px] opacity-50">
                    Debug: {JSON.stringify(pageviewsData).slice(0, 200)}
                  </span>
                </div>
              )}
            </Card>

            {/* Row 4: Pages / Referrers / Cidades */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Top Páginas
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : pages.length > 0 ? (
                  <MetricTable items={pages} label="path" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Fontes de Tráfego
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : referrers.length > 0 ? (
                  <MetricTable items={referrers} label="referrer" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Cidades
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : cities.length > 0 ? (
                  <MetricTable items={cities} label="city" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>
            </div>

            {/* Row 5: Devices / Browsers / OS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Dispositivos
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-5 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : devices.length > 0 ? (
                  <div className="space-y-2">
                    {devices.slice(0, 5).map((item) => {
                      const max = Math.max(...devices.map((d) => d.y), 1);
                      const pct = Math.max((item.y / max) * 100, 2);
                      return (
                        <div key={item.x} className="flex items-center gap-2 text-sm">
                          <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                            <DeviceIcon name={item.x} />
                          </span>
                          <span className="text-xs text-muted-foreground truncate w-20 shrink-0">{item.x || "Outro"}</span>
                          <div className="flex-1 h-5 bg-muted/20 rounded overflow-hidden">
                            <div
                              className="h-full bg-violet-500/60 rounded transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{fmt(item.y)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Navegadores
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-5 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : browsers.length > 0 ? (
                  <MiniBarChart items={browsers} color="cyan" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>

              <Card className="p-4 bg-card border-border/50">
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  Sistemas Operacionais
                </h2>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-5 bg-muted/20 rounded animate-pulse" />
                    ))}
                  </div>
                ) : os.length > 0 ? (
                  <MiniBarChart items={os} color="teal" />
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
