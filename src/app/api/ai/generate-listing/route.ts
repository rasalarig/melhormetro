import { NextRequest, NextResponse } from 'next/server';

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

function buildPrompt(data: {
  type: string;
  area: string;
  price: string;
  city: string;
  state: string;
  neighborhood: string;
  address: string;
  characteristics: string[];
  bedrooms: string;
  bathrooms: string;
  garage: string;
  pool: boolean;
  gatedCommunity: boolean;
  pavedStreet: boolean;
  currentTitle: string;
  currentDescription: string;
}) {
  const typeLabel = typeLabels[data.type] || data.type;
  const priceFormatted = data.price ? `R$ ${Number(data.price).toLocaleString('pt-BR')}` : '';

  const details: string[] = [];
  if (data.bedrooms && data.bedrooms !== '0') details.push(`${data.bedrooms} quarto(s)`);
  if (data.bathrooms && data.bathrooms !== '0') details.push(`${data.bathrooms} banheiro(s)`);
  if (data.garage && data.garage !== '0') details.push(`${data.garage} vaga(s) de garagem`);
  if (data.pool) details.push('piscina');
  if (data.gatedCommunity) details.push('condomínio fechado');
  if (data.pavedStreet) details.push('rua asfaltada');

  return `Você é um corretor de imóveis experiente no Brasil. Gere um título atraente e uma descrição detalhada e persuasiva para o seguinte anúncio de imóvel.

DADOS DO IMÓVEL:
- Tipo: ${typeLabel}
- Área: ${data.area ? data.area + ' m²' : 'não informada'}
- Preço: ${priceFormatted || 'não informado'}
- Cidade: ${data.city || 'não informada'}
- Estado: ${data.state || 'SP'}
- Bairro: ${data.neighborhood || 'não informado'}
- Endereço: ${data.address || 'não informado'}
- Características: ${data.characteristics.length > 0 ? data.characteristics.join(', ') : 'nenhuma informada'}
- Detalhes: ${details.length > 0 ? details.join(', ') : 'nenhum informado'}
${data.currentTitle ? `- Título atual (melhore este): ${data.currentTitle}` : ''}
${data.currentDescription ? `- Descrição atual (melhore esta): ${data.currentDescription}` : ''}

REGRAS:
1. O título deve ser curto (máximo 80 caracteres), atraente e incluir o tipo do imóvel, área e localização
2. A descrição deve ter 3-5 parágrafos, ser persuasiva, destacar os pontos fortes e usar linguagem profissional de mercado imobiliário
3. Não invente informações que não foram fornecidas
4. Use emojis com moderação (máximo 2-3 no total, apenas na descrição)
5. Se houver título/descrição atual, melhore-os mantendo as informações corretas

Responda EXATAMENTE neste formato JSON:
{"title": "o título aqui", "description": "a descrição aqui"}`;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const prompt = buildPrompt(data);

    // Try OpenAI first
    if (openaiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: openaiKey });

        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const result = JSON.parse(content);
          return NextResponse.json(result);
        }
      } catch (error) {
        console.error("[GenerateListing] OpenAI failed:", error);
      }
    }

    // Fallback to Claude
    if (anthropicKey) {
      try {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: anthropicKey });

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            { role: "user", content: prompt },
          ],
        });

        const textBlock = response.content.find((c) => c.type === "text");
        if (textBlock && textBlock.type === "text") {
          let jsonText = textBlock.text.trim();
          const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
          }
          const result = JSON.parse(jsonText);
          return NextResponse.json(result);
        }
      } catch (error) {
        console.error("[GenerateListing] Claude failed:", error);
      }
    }

    return NextResponse.json({ error: 'Nenhum serviço de IA disponível' }, { status: 503 });
  } catch (error) {
    console.error("[GenerateListing] Error:", error);
    return NextResponse.json({ error: 'Erro ao gerar descrição' }, { status: 500 });
  }
}
