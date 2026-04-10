import { Suspense } from "react";
import { SearchPageClient } from "@/components/search-page-client";

export const metadata = {
  title: "Busca Inteligente | MelhorMetro",
  description:
    "Busque imóveis por linguagem natural com inteligência artificial",
};

export default function BuscaPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-16 pb-16 px-4 text-center">Carregando...</div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
