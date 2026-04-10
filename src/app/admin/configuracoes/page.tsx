"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Settings, Save, ArrowLeft, Check, Percent, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConfiguracoesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [commissionRate, setCommissionRate] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/admin/config");
        const data = await res.json();
        if (data.commission_rate !== undefined) {
          setCommissionRate(String(data.commission_rate));
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "commission_rate", value: commissionRate }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
    } finally {
      setSaving(false);
    }
  }

  const rate = parseFloat(commissionRate) || 0;
  const basePrice = 500000;
  const displayPrice = basePrice * (1 + rate / 100);
  const formattedDisplay = displayPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  if (authLoading || loading) {
    return (
      <div className="pt-16 pb-16 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configurações da Plataforma</h1>
              <p className="text-muted-foreground text-sm">Gerencie as configurações globais do sistema</p>
            </div>
          </div>
        </div>

        {/* Commission Rate Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Percent className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Taxa de Comissão</h2>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Percentual que será acrescido ao valor informado pelo proprietário do imóvel. Esta taxa é aplicada
            automaticamente ao preço de exibição.
          </p>

          <div className="flex items-center gap-3">
            <div className="relative w-40">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/30 rounded-xl px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Exemplo:</span> Imóvel de R$ 500.000,00 &rarr; Preço exibido:{" "}
            <span className="font-semibold text-emerald-500">{formattedDisplay}</span>
          </div>

          {/* Save button + success toast */}
          <div className="flex items-center gap-4 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>

            {saved && (
              <div className="flex items-center gap-2 text-sm text-emerald-500 animate-in fade-in slide-in-from-left-2">
                <Check className="w-4 h-4" />
                Configuração salva com sucesso!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
