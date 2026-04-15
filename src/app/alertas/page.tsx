import { Suspense } from "react";
import { AlertsPageClient } from "@/components/alerts-page";

export const metadata = {
  title: "Perfil de Interesse | MelhorMetro",
  description:
    "Descreva o imóvel que você procura e receba notificações quando novos imóveis compatíveis forem cadastrados.",
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
