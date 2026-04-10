import { PropertyForm } from "@/components/property-form";

export const metadata = {
  title: "Cadastrar Imóvel | MelhorMetro",
  description: "Cadastre um novo imóvel na plataforma",
};

export default function CadastroPage() {
  return (
    <div className="pt-16 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Cadastrar Novo Imóvel</h1>
        <p className="text-muted-foreground mb-8">
          Preencha os detalhes do imóvel. Quanto mais informações, melhor a busca por IA.
        </p>
        <PropertyForm />
      </div>
    </div>
  );
}
