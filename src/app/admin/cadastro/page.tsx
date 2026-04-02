import { PropertyForm } from "@/components/property-form";

export const metadata = {
  title: "Cadastrar Imovel | PropView",
  description: "Cadastre um novo imovel na plataforma",
};

export default function CadastroPage() {
  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Cadastrar Novo Imovel</h1>
        <p className="text-muted-foreground mb-8">
          Preencha os detalhes do imovel. Quanto mais informacoes, melhor a busca por IA.
        </p>
        <PropertyForm />
      </div>
    </div>
  );
}
