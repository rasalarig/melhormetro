import { Suspense } from "react";
import { AlertsPageClient } from "@/components/alerts-page";

export const metadata = {
  title: "Alertas de Busca | MelhorMetro",
  description:
    "Crie alertas para ser notificado quando novos imóveis combinarem com o que você procura",
};

export default function AlertasPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-16 pb-16 px-4 text-center text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <AlertsPageClient />
    </Suspense>
  );
}
