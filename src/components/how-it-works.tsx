import { Search, Sparkles, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Descreva o que busca",
    description: "Use suas próprias palavras. \"Terreno com árvores frutíferas\" ou \"casa perto de escola\" — vale tudo!",
  },
  {
    icon: Sparkles,
    title: "IA interpreta sua busca",
    description: "Nossa inteligência artificial entende o contexto e encontra imóveis que combinam com o que você descreveu.",
  },
  {
    icon: Search,
    title: "Resultados inteligentes",
    description: "Veja imóveis rankeados por relevância, com explicação de por que cada um combina com sua busca.",
  },
  {
    icon: CheckCircle,
    title: "Encontre o ideal",
    description: "Compare detalhes, veja fotos e entre em contato diretamente com o corretor.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Como Funciona</h2>
          <p className="text-muted-foreground">Busca inteligente que entende o que você realmente quer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-emerald-400" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
