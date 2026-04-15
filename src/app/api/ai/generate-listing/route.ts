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

function buildPromptFromFreeText(userPrompt: string) {
  const validTypes = Object.keys(typeLabels).join(', ');

  return `Você é um corretor de imóveis experiente no Brasil. O usuário descreveu um imóvel em linguagem natural. Analise o texto e extraia todas as informações possíveis para preencher um formulário de anúncio imobiliário.

TEXTO DO USUÁRIO:
"${userPrompt}"

TIPOS DE IMÓVEL VÁLIDOS: ${validTypes}

INSTRUÇÕES:
1. Extraia todas as informações mencionadas no texto
2. Gere um título atraente (máximo 80 caracteres) e uma descrição persuasiva (3-5 parágrafos) em português
3. Para campos não mencionados, use null
4. Para "type", escolha o tipo mais adequado dentre os válidos acima, ou null se não for possível determinar
5. Para "price", retorne apenas o número sem formatação (ex: 850000 para R$ 850.000)
6. Para "area", retorne apenas o número em m² (ex: 200 para 200m²)
7. Para "bedrooms", "bathrooms", "garage_spots", retorne apenas o número inteiro
8. Para "state", use a sigla de 2 letras (ex: "SP", "RJ")
9. Para "characteristics", inclua amenidades e características relevantes mencionadas como array de strings em português
10. Para "has_pool", "is_gated_community", "is_paved_street", retorne true/false/null
11. Não invente informações que não foram mencionadas no texto

Responda EXATAMENTE neste formato JSON (sem texto adicional):
{
  "title": "string",
  "description": "string",
  "type": "string ou null",
  "price": "número ou null",
  "area": "número ou null",
  "bedrooms": "número ou null",
  "bathrooms": "número ou null",
  "garage_spots": "número ou null",
  "city": "string ou null",
  "state": "string ou null",
  "neighborhood": "string ou null",
  "address": "string ou null",
  "has_pool": "boolean ou null",
  "is_gated_community": "boolean ou null",
  "is_paved_street": "boolean ou null",
  "characteristics": []
}`;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If a free-text prompt is provided, use the extraction mode
    const isPromptMode = typeof data.prompt === 'string' && data.prompt.trim().length > 0;
    const prompt = isPromptMode ? buildPromptFromFreeText(data.prompt.trim()) : buildPrompt(data);

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
