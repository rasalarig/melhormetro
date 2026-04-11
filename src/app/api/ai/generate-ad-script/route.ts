import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = {
  terreno: "Terreno",
  terreno_condominio: "Terreno em Condomínio",
  casa: "Casa",
  casa_condominio: "Casa em Condomínio",
  apartamento: "Apartamento",
  comercial: "Comercial",
  rural: "Rural",
};

function buildPrompt(property: {
  title: string;
  description: string;
  type: string;
  price: number;
  area: number;
  city: string;
  state: string;
  neighborhood: string;
  characteristics: string[];
}) {
  const typeLabel = typeLabels[property.type] || property.type;
  const priceFormatted = property.price
    ? `R$ ${property.price.toLocaleString('pt-BR')}`
    : 'não informado';
  const chars = property.characteristics?.length > 0
    ? property.characteristics.join(', ')
    : 'não informadas';

  return `Você é um especialista em marketing imobiliário digital no Brasil. Seu trabalho é criar roteiros de anúncios que VENDEM.

Analise o imóvel abaixo e gere um roteiro de anúncio completo com 4 seções. O roteiro deve ser estratégico, usar gatilhos mentais (escassez, exclusividade, urgência, prova social) de forma natural e direcionar o anúncio para o perfil de comprador mais provável para este tipo de imóvel.

DADOS DO IMÓVEL:
- Tipo: ${typeLabel}
- Título: ${property.title}
- Descrição: ${property.description}
- Preço: ${priceFormatted}
- Área: ${property.area} m²
- Cidade: ${property.city}, ${property.state}
- Bairro: ${property.neighborhood || 'não informado'}
- Características: ${chars}

PERFIL DO PÚBLICO-ALVO:
Identifique o perfil ideal de comprador baseado no tipo, preço e localização do imóvel. Exemplos:
- Terreno em condomínio fechado → Famílias que querem construir casa própria, investidores
- Casa popular → Primeiro imóvel, jovens casais, programa habitacional
- Apartamento de luxo → Executivos, alta renda
- Terreno rural → Investidores, agronegócio, retiro
Adapte TODO o texto para falar diretamente com esse público.

Responda EXATAMENTE neste formato JSON:
{
  "target_audience": "Descrição breve do público-alvo ideal (1-2 frases)",
  "headline": "Frase de impacto para título do anúncio (máx 100 caracteres)",
  "portal_description": "Texto persuasivo de 3-4 parágrafos para portais imobiliários (OLX, ZAP, VivaReal). Linguagem profissional, destaque diferenciais, inclua call-to-action. Sem emojis.",
  "social_media_caption": "Texto para post no Instagram/Facebook. Use emojis com estratégia, hashtags relevantes, linguagem envolvente. Máximo 300 palavras. Inclua call-to-action.",
  "video_script": "Roteiro de vídeo de 30-60 segundos para Reels/TikTok. Formato: [CENA 1] descrição do que mostrar + o que falar... [CENA 2]... etc. Linguagem dinâmica, abra com gancho que prende atenção."
}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const property = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const prompt = buildPrompt(property);

    // Try OpenAI first
    if (openaiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: openaiKey });

        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.8,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          return NextResponse.json(JSON.parse(content));
        }
      } catch (error) {
        console.error("[AdScript] OpenAI failed:", error);
      }
    }

    // Fallback to Claude
    if (anthropicKey) {
      try {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: anthropicKey });

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        const textBlock = response.content.find((c) => c.type === "text");
        if (textBlock && textBlock.type === "text") {
          let jsonText = textBlock.text.trim();
          const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) jsonText = jsonMatch[1].trim();
          return NextResponse.json(JSON.parse(jsonText));
        }
      } catch (error) {
        console.error("[AdScript] Claude failed:", error);
      }
    }

    return NextResponse.json({ error: 'Nenhum serviço de IA disponível' }, { status: 503 });
  } catch (error) {
    console.error("[AdScript] Error:", error);
    return NextResponse.json({ error: 'Erro ao gerar roteiro' }, { status: 500 });
  }
}
