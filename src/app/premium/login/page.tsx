"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, LogIn, Crown } from "lucide-react";

export default function PremiumLoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/premium");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Digite um email válido");
      return;
    }
    if (!password || password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Digite seu nome");
      return;
    }

    if (mode === "register" && !acceptedTerms) {
      setError("Você deve aceitar a Política de Privacidade e os Termos de Uso");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(name.trim(), email.trim(), password, confirmPassword);
      } else {
        await login(email.trim(), password);
      }
      router.replace("/premium");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar. Tente novamente.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    // Store redirect target for after OAuth
    document.cookie = "premium_redirect=1;path=/;max-age=300";
    window.location.href = "/api/auth/google";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-amber-100/40">Carregando...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center px-4 pt-28 md:pt-28 pb-24 md:pb-4 overflow-y-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-[hsl(220,20%,7%)]/80 backdrop-blur-sm border border-amber-500/20 shadow-xl shadow-amber-500/5">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 mb-4">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-amber-100">
            {mode === "login" ? "Entrar" : "Criar Conta"}
          </h1>
          <p className="text-sm text-amber-100/40 mt-1">
            {mode === "login"
              ? "Acesse o MelhorMetro Premium"
              : "Crie sua conta para acessar o Premium"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-amber-100/70">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/30" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-[hsl(220,20%,4%)] border-amber-500/20 text-amber-100 placeholder:text-amber-100/20 focus-visible:ring-amber-500/50"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-amber-100/70">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/30" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-[hsl(220,20%,4%)] border-amber-500/20 text-amber-100 placeholder:text-amber-100/20 focus-visible:ring-amber-500/50"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-amber-100/70">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/30" />
              <Input
                id="password"
                type="password"
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-[hsl(220,20%,4%)] border-amber-500/20 text-amber-100 placeholder:text-amber-100/20 focus-visible:ring-amber-500/50"
                disabled={submitting}
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-amber-100/70">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-100/30" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-[hsl(220,20%,4%)] border-amber-500/20 text-amber-100 placeholder:text-amber-100/20 focus-visible:ring-amber-500/50"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2 text-xs text-amber-100/50 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-amber-500/30"
              />
              <span>
                Li e aceito a{" "}
                <a href="/privacidade" target="_blank" className="text-amber-400 underline">Política de Privacidade</a>
                {" "}e os{" "}
                <a href="/termos" target="_blank" className="text-amber-400 underline">Termos de Uso</a>
              </span>
            </label>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {mode === "login" ? "Entrando..." : "Cadastrando..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                {mode === "login" ? "Entrar" : "Criar Conta"}
              </span>
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          {mode === "login" ? (
            <p className="text-sm text-amber-100/40">
              Não tem conta?{" "}
              <button onClick={() => { setMode("register"); setError(""); setConfirmPassword(""); setAcceptedTerms(false); }} className="text-amber-400 hover:text-amber-300 font-medium">
                Cadastre-se
              </button>
            </p>
          ) : (
            <p className="text-sm text-amber-100/40">
              Já tem conta?{" "}
              <button onClick={() => { setMode("login"); setError(""); setConfirmPassword(""); setAcceptedTerms(false); }} className="text-amber-400 hover:text-amber-300 font-medium">
                Entrar
              </button>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-500/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[hsl(220,20%,7%)] px-2 text-amber-100/30">ou</span>
          </div>
        </div>

        {/* Google button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleClick}
          className="w-full border-amber-500/20 hover:bg-amber-500/5 text-amber-100/70 font-medium"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
