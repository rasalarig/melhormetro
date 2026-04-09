"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { Crown, Building2, Shield, Sparkles, ArrowRight, KeyRound, Film, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function PremiumPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setActivating(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/premium/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Acesso Premium ativado!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.error || "Erro ao ativar código");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setActivating(false);
    }
  };

  const isPremium = user?.is_premium;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        </div>

        <div className="container mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/5 mb-8">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-400">Exclusivo para imobiliárias selecionadas</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Imóveis Selecionados
            </span>
            <br />
            <span className="text-amber-100/90 text-3xl md:text-4xl">
              para um público exclusivo
            </span>
          </h1>

          <p className="text-lg md:text-xl text-amber-100/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            Uma curadoria exclusiva para imobiliárias premium.
            Acesse imóveis selecionados a dedo para clientes exigentes.
          </p>

          {/* CTA area based on auth state */}
          {loading ? (
            <div className="animate-pulse text-amber-100/30">Carregando...</div>
          ) : isPremium ? (
            /* Premium user - show explore buttons */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/premium/reels">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-8 shadow-lg shadow-amber-500/20">
                  <Film className="w-5 h-5 mr-2" />
                  Explorar Reels
                </Button>
              </Link>
              <Link href="/premium/imoveis">
                <Button size="lg" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-8">
                  <Home className="w-5 h-5 mr-2" />
                  Ver Imóveis
                </Button>
              </Link>
            </div>
          ) : user ? (
            /* Logged in but not premium - show activation */
            <div className="max-w-md mx-auto">
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-[hsl(220,20%,7%)]/80 backdrop-blur">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-amber-100">Ativar Acesso Premium</h3>
                </div>
                <p className="text-sm text-amber-100/40 mb-4">
                  Digite o código exclusivo fornecido pela sua imobiliária
                </p>
                <form onSubmit={handleActivate} className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO PREMIUM"
                    className="bg-[hsl(220,20%,4%)] border-amber-500/20 text-amber-100 placeholder:text-amber-100/20 focus-visible:ring-amber-500/50 font-mono tracking-wider text-center"
                    disabled={activating}
                  />
                  <Button
                    type="submit"
                    disabled={activating || !code.trim()}
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-6"
                  >
                    {activating ? "..." : "Ativar"}
                  </Button>
                </form>
                {message && <p className="text-sm text-green-400 mt-3">{message}</p>}
                {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
              </div>
            </div>
          ) : (
            /* Not logged in - show login CTA */
            <div className="flex flex-col items-center gap-4">
              <Link href="/premium/login">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-10 shadow-lg shadow-amber-500/20">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Acessar Premium
                </Button>
              </Link>
              <p className="text-sm text-amber-100/30">
                Já tem conta?{" "}
                <Link href="/premium/login" className="text-amber-400 hover:text-amber-300">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-amber-500/10 bg-[hsl(220,20%,7%)]/50 hover:border-amber-500/20 transition-colors">
              <Building2 className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-amber-100 mb-2">Curadoria Exclusiva</h3>
              <p className="text-sm text-amber-100/40 leading-relaxed">
                Imóveis selecionados a dedo pela plataforma. Casas, mansões e propriedades de destaque.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-amber-500/10 bg-[hsl(220,20%,7%)]/50 hover:border-amber-500/20 transition-colors">
              <Shield className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-amber-100 mb-2">Acesso Restrito</h3>
              <p className="text-sm text-amber-100/40 leading-relaxed">
                Apenas imobiliárias convidadas têm acesso. Garantia de exclusividade e privacidade.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-amber-500/10 bg-[hsl(220,20%,7%)]/50 hover:border-amber-500/20 transition-colors">
              <Sparkles className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-amber-100 mb-2">Experiência Premium</h3>
              <p className="text-sm text-amber-100/40 leading-relaxed">
                Interface refinada com navegação estilo reels para apresentação imersiva dos imóveis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
