import { Suspense } from "react";
import { AlertsPageClient } from "@/components/alerts-page";

export const metadata = {
  title: "Alertas de Busca | PropView",
  description:
    "Crie alertas para ser notificado quando novos imoveis combinarem com o que voce procura",
};

export default function AlertasPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16 px-4 text-center text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <AlertsPageClient />
    </Suspense>
  );
}
