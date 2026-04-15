"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Film, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

const DISMISSED_KEY = "tours_cta_dismissed";

export function ToursCTABanner() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    setDismissed(stored === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  // Don't show when loading, when user is logged in, or when dismissed
  if (loading || user || dismissed) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 via-teal-900/95 to-emerald-900/95 border-b border-emerald-500/20 backdrop-blur-sm shadow-lg">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">
              Descubra imóveis em vídeo
            </p>
            <p className="text-xs text-emerald-200/80 mt-0.5 leading-snug">
              Navegue pelos melhores imóveis no estilo reels — sem precisar criar conta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/reels">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              <Film className="w-3.5 h-3.5 mr-1.5" />
              Ver Tours
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Entrar
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            className="p-1.5 rounded-md text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
