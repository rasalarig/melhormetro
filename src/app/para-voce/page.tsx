import {
  Home,
  Building2,
  Sparkles,
  Eye,
  Target,
  BarChart3,
  MessageSquare,
  Bell,
  Check,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Para Você | MelhorMetro - Plataforma de Imóveis",
  description:
    "Venda seus imóveis com mais visibilidade. Planos para proprietários e corretores com IA, leads qualificados e ferramentas profissionais.",
};

// ─── Data ──────────────────────────────────────────────────────────────────

const benefits = [
  {
    icon: Sparkles,
    title: "IA Integrada",
    description:
      "Busca inteligente, comparação de imóveis e reimaginação de ambientes com inteligência artificial.",
  },
  {
    icon: Eye,
    title: "Reels de Imóveis",
    description:
      "Apresente seus imóveis em formato de vídeo curto, como no Instagram. Mais engajamento, mais visitas.",
  },
  {
    icon: Target,
    title: "Leads Qualificados",
    description:
      "Sistema de temperatura de leads (frio, morno, quente) para você focar nos compradores mais prontos.",
  },
  {
    icon: BarChart3,
    title: "Métricas de Engajamento",
    description:
      "Saiba quantas visualizações, curtidas e cliques cada imóvel recebe em tempo real.",
  },
  {
    icon: MessageSquare,
    title: "Chat Integrado",
    description:
      "Converse diretamente com compradores interessados sem sair da plataforma.",
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description:
      "Compradores recebem notificações automáticas quando um imóvel compatível é cadastrado.",
  },
];

const steps = [
  {
    number: "1",
    title: "Cadastre-se",
    description: "Crie sua conta gratuitamente em menos de 1 minuto.",
  },
  {
    number: "2",
    title: "Cadastre seus imóveis",
    description: "Adicione fotos, vídeos e todas as informações do imóvel.",
  },
  {
    number: "3",
    title: "Receba interessados",
    description:
      "Compradores encontram seus imóveis e entram em contato diretamente.",
  },
];

const plans = [
  {
    name: "Grátis",
    range: "Até 3 imóveis",
    price: "R$ 0",
    period: "/mês",
    highlight: false,
    badge: null,
    cta: "Começar Grátis",
    features: ["Cadastro de imóveis", "Página do imóvel", "Receber contatos"],
  },
  {
    name: "Starter",
    range: "Até 15 imóveis",
    price: "R$ 0",
    period: "/mês",
    highlight: false,
    badge: "Grátis por tempo limitado",
    cta: "Começar Grátis",
    features: [
      "Tudo do Grátis",
      "Leads com temperatura",
      "Métricas básicas",
      "Suporte por email",
    ],
  },
  {
    name: "Profissional",
    range: "Até 50 imóveis",
    price: "R$ 0",
    period: "/mês",
    highlight: true,
    badge: "Grátis por tempo limitado",
    cta: "Começar Grátis",
    features: [
      "Tudo do Starter",
      "Campanhas de marketing",
      "Relatórios avançados",
      "IA integrada",
      "Suporte prioritário",
    ],
  },
  {
    name: "Imobiliária",
    range: "Ilimitado",
    price: "R$ 0",
    period: "/mês",
    highlight: false,
    badge: "Grátis por tempo limitado",
    cta: "Começar Grátis",
    features: [
      "Tudo do Profissional",
      "Importação em massa",
      "API de integração",
      "Gerente de conta dedicado",
      "Múltiplos usuários",
    ],
  },
];

const faqs = [
  {
    question: "Preciso pagar para cadastrar meu imóvel?",
    answer:
      "Não! Proprietários podem cadastrar até 3 imóveis gratuitamente, sem necessidade de cartão de crédito. O plano gratuito inclui página do imóvel e recebimento de contatos de compradores interessados.",
  },
  {
    question: "Como funciona a taxa de comissão?",
    answer:
      "A plataforma aplica uma pequena taxa sobre o valor do imóvel para manter a operação. Essa taxa só é cobrada em caso de transação concluída — você não paga nada antecipado além da assinatura do seu plano.",
  },
  {
    question: "Posso cancelar meu plano a qualquer momento?",
    answer:
      "Sim, sem multa nem fidelidade. Você pode cancelar ou mudar de plano quando quiser pelo painel de configurações. O acesso às funcionalidades do plano se mantém até o final do período pago.",
  },
  {
    question: "Como os compradores encontram meus imóveis?",
    answer:
      "Através da busca inteligente com IA, reels de imóveis, alertas automáticos para compradores com perfil compatível e nossa plataforma de divulgação. Quanto mais completo o cadastro, maior o alcance.",
  },
  {
    question: "Vocês oferecem suporte?",
    answer:
      "Sim! Todos os planos incluem suporte via chat e email. Planos pagos têm suporte prioritário com tempo de resposta reduzido. O plano Imobiliária inclui ainda um gerente de conta dedicado.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ParaVocePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* subtle gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-background to-teal-950/20" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <span className="mb-6 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            Plataforma de Imóveis com IA
          </span>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-balance md:text-6xl">
            Venda seus imóveis com{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              mais visibilidade
            </span>{" "}
            e menos esforço
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A plataforma que conecta proprietários e corretores aos compradores
            certos, com tecnologia de ponta e inteligência artificial.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:shadow-emerald-700/50 hover:brightness-110"
            >
              Começar Agora
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <a
              href="#planos"
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-8 py-3.5 text-base font-semibold text-foreground transition-all duration-300 hover:border-emerald-500/40 hover:bg-card/80"
            >
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Para Quem é ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              Para quem é o MelhorMetro?
            </h2>
            <p className="text-muted-foreground">
              Soluções pensadas tanto para proprietários quanto para
              profissionais do mercado.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* B2C */}
            <div className="group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-emerald-500/30">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                <Home className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Proprietário</h3>
              <p className="mb-6 text-muted-foreground">
                Você tem um imóvel para vender? Cadastre gratuitamente e alcance
                milhares de compradores. Sem burocracia, sem complicação.
              </p>
              <ul className="space-y-3">
                {[
                  "Cadastro gratuito",
                  "Alcance de compradores qualificados",
                  "Receba propostas diretamente",
                  "Sem taxa de adesão",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* B2B */}
            <div className="group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-emerald-500/30">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-teal-500/10">
                <Building2 className="h-7 w-7 text-teal-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Corretor / Imobiliária</h3>
              <p className="mb-6 text-muted-foreground">
                Gerencie seu portfólio de imóveis em um só lugar. Planos
                flexíveis por faixa de imóveis com ferramentas profissionais.
              </p>
              <ul className="space-y-3">
                {[
                  "Importação em massa",
                  "Leads com temperatura",
                  "Campanhas de marketing",
                  "Relatórios de engajamento",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-teal-400" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Benefícios ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground">
              Ferramentas modernas para vender mais rápido e com mais
              eficiência.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-emerald-500/30"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Como Funciona ────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              Como funciona
            </h2>
            <p className="text-muted-foreground">
              Simples, rápido e sem complicação.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connecting line — visible only on md+ */}
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent md:block" />

            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-lg shadow-emerald-900/40">
                  {number}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Planos ───────────────────────────────────────────────────── */}
      <section id="planos" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-muted-foreground">
              Escolha o plano ideal para o seu volume de imóveis
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300 ${
                  plan.highlight
                    ? "border-emerald-500 shadow-lg shadow-emerald-900/30"
                    : "border-border/50 hover:border-emerald-500/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-xs font-semibold text-white shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.range}</p>
                </div>

                <div className="mb-6 flex items-end gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>

                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/login"
                  className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110"
                      : "border border-border/50 text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              Perguntas frequentes
            </h2>
            <p className="text-muted-foreground">
              Tire suas dúvidas antes de começar.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-xl border border-border/50 bg-card transition-all duration-300 open:border-emerald-500/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium">
                  <span>{question}</span>
                  {/* custom chevron that rotates when open */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA Final ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-10 text-center shadow-xl shadow-emerald-900/20">
            {/* decorative glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

            <div className="relative">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                Pronto para vender mais?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Junte-se a centenas de proprietários e corretores que já estão
                usando o MelhorMetro.
              </p>
              <a
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:shadow-emerald-700/50 hover:brightness-110"
              >
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
