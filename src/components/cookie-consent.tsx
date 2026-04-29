"use client";

import { useState, useEffect } from "react";

export type CookieConsentStatus = "accepted" | "refused" | null;

const STORAGE_KEY = "cookie-consent";

export function useCookieConsent(): CookieConsentStatus {
  const [status, setStatus] = useState<CookieConsentStatus>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "refused") {
      setStatus(stored);
    }
  }, []);

  return status;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem(STORAGE_KEY, "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[60] p-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-2xl bg-card border border-border/60 rounded-xl shadow-2xl shadow-black/40 p-4 pointer-events-auto">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o
          tráfego do site e personalizar conteúdo. Ao continuar navegando, você concorda com
          nossa{" "}
          <a href="/privacidade" className="text-emerald-400 underline hover:text-emerald-300">
            Política de Privacidade
          </a>
          .
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleRefuse}
            className="px-4 py-1.5 text-sm rounded-lg border border-border/60 text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
