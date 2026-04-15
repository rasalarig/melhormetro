import { NextRequest, NextResponse } from 'next/server';
import { getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  address: string;
  city: string;
  state: string;
  neighborhood: string | null;
  status: string;
  characteristics: string;
  details: string;
  created_at: string;
  address_privacy?: string;
  approximate_radius_km?: number | null;
  allow_resale?: boolean;
  resale_commission_percent?: number | null;
  resale_terms?: string | null;
}

const typeLabels: Record<string, string> = {
  terreno: 'Terreno',
  terreno_condominio: 'Terreno em Condomínio',
  casa: 'Casa',
  casa_condominio: 'Casa em Condomínio',
  apartamento: 'Apartamento',
  comercial: 'Comercial',
  rural: 'Rural',
};

function formatPropertyData(property: Property): string {
  const characteristics: string[] = JSON.parse(property.characteristics || '[]');
  const details: Record<string, unknown> = JSON.parse(property.details || '{}');

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  const typeLabel = typeLabels[property.type] || property.type;

  const lines: string[] = [
    `Tipo: ${typeLabel}`,
    `Título: ${property.title}`,
    `Descrição: ${property.description}`,
    `Preço: ${priceFormatted}`,
    `Área total: ${property.area} m²`,
    `Preço por m²: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price / property.area)}/m²`,
  ];

  // Location
  if (property.address_privacy === 'approximate') {
    lines.push(`Localização: ${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city} - ${property.state} (endereço exato não divulgado)`);
  } else {
    lines.push(`Endereço: ${property.address}`);
    if (property.neighborhood) lines.push(`Bairro: ${property.neighborhood}`);
    lines.push(`Cidade/Estado: ${property.city} - ${property.state}`);
  }

  // Numeric details
  const detailLabels: Record<string, string> = {
    bedrooms: 'Quartos',
    bathrooms: 'Banheiros',
    garage: 'Vagas de garagem',
    pool: 'Piscina',
    gated_community: 'Condomínio fechado',
    paved_street: 'Rua asfaltada',
  };
  const detailLines: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    const label = detailLabels[key];
    if (!label) continue;
    if (typeof value === 'boolean') {
      detailLines.push(`${label}: ${value ? 'Sim' : 'Não'}`);
    } else if (value !== null && value !== undefined && value !== 0 && value !== '0') {
      detailLines.push(`${label}: ${value}`);
    }
  }
  if (detailLines.length > 0) {
    lines.push(`Detalhes: ${detailLines.join(', ')}`);
  }

  // Characteristics
  if (characteristics.length > 0) {
    lines.push(`Características: ${characteristics.join(', ')}`);
  }

  // Resale info
  if (property.allow_resale) {
    lines.push(`Disponível para recomercialização: Sim`);
    if (property.resale_commission_percent != null) {
      lines.push(`Comissão de recomercialização: ${property.resale_commission_percent}%`);
    }
    if (property.resale_terms) {
      lines.push(`Termos de recomercialização: ${property.resale_terms}`);
    }
  }

  return lines.join('\n');
}

function buildSystemPrompt(property: Property): string {
  const propertyData = formatPropertyData(property);

  return `Você é um assistente virtual do portal MelhorMetro. Responda perguntas sobre este imóvel com base APENAS nas informações disponíveis. Se não souber a resposta, diga que essa informação não está disponível no anúncio e sugira que o comprador entre em contato com o vendedor.

DADOS DO IMÓVEL:
${propertyData}

REGRAS:
1. Responda APENAS com base nos dados acima
2. Seja objetivo e útil
3. Responda em português do Brasil
4. Se perguntarem sobre algo não mencionado nos dados, diga "Essa informação não consta no anúncio. Recomendo entrar em contato com o vendedor para mais detalhes."
5. Nunca invente informações
6. Mantenha respostas concisas (máximo 3 parágrafos)`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, question, history = [] } = body as {
      propertyId: number;
      question: string;
      history: ChatMessage[];
    };

    if (!propertyId || !question?.trim()) {
      return NextResponse.json({ error: 'propertyId e question são obrigatórios' }, { status: 400 });
    }

    // Fetch property from DB
    const property = await getOne(
      `SELECT p.*, s.user_id as seller_user_id
       FROM properties p
       LEFT JOIN sellers s ON p.seller_id = s.id
       WHERE p.id = $1`,
      [propertyId]
    ) as Property | null;

    if (!property) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
    }

    const systemPrompt = buildSystemPrompt(property);

    // Build messages array (history + current question)
    const messages: ChatMessage[] = [
      ...history.slice(-10), // keep last 10 messages for context
      { role: 'user', content: question.trim() },
    ];

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Try OpenAI first
    if (openaiKey) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: openaiKey });

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 512,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        });

        const answer = response.choices[0]?.message?.content;
        if (answer) {
          return NextResponse.json({ answer });
        }
      } catch (error) {
        console.error('[PropertyChat] OpenAI failed:', error);
      }
    }

    // Fallback to Claude
    if (anthropicKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey: anthropicKey });

        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const textBlock = response.content.find((c) => c.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          return NextResponse.json({ answer: textBlock.text });
        }
      } catch (error) {
        console.error('[PropertyChat] Claude failed:', error);
      }
    }

    return NextResponse.json(
      { error: 'Nenhum serviço de IA disponível no momento.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('[PropertyChat] Error:', error);
    return NextResponse.json({ error: 'Erro ao processar pergunta' }, { status: 500 });
  }
}
