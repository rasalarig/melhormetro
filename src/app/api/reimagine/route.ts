import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) {
    return true;
  }
  entry.count++;
  return false;
}

const styleDescriptions: Record<string, string> = {
  moderno: 'modern minimalist with clean lines, neutral tones, and contemporary furniture',
  rustico: 'rustic warm with exposed wood beams, natural stone, earth tones, and vintage furniture',
  minimalista: 'ultra-minimalist with very few items, white and light tones, simple forms',
  industrial: 'industrial loft style with exposed brick, metal accents, concrete surfaces, and Edison bulbs',
  classico: 'classic elegant with ornate moldings, chandelier, rich fabrics, and traditional furniture',
  tropical: 'tropical style with plants, natural materials, wicker furniture, and vibrant colors',
  escandinavo: 'Scandinavian style with light wood, white walls, cozy textiles, and functional design',
};

const colorDescriptions: Record<string, string> = {
  branco: 'white',
  bege: 'warm beige',
  cinza: 'light gray',
  azul: 'soft blue',
  verde: 'sage green',
  terracota: 'terracotta',
  amarelo: 'warm yellow',
  rosa: 'blush pink',
};

const floorDescriptions: Record<string, string> = {
  madeira: 'hardwood flooring',
  porcelanato: 'porcelain tile flooring',
  marmore: 'marble flooring',
  cimento: 'polished concrete flooring',
  vinilico: 'vinyl wood-look flooring',
  ceramica: 'ceramic tile flooring',
};

export async function POST(request: NextRequest) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });
  }

  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Limite de gerações atingido. Tente novamente em 1 hora.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  const { image_url, style, wall_color, floor, custom_prompt } = body;

  if (!image_url) {
    return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: openaiKey });

  // Build the prompt
  let prompt = 'Create a photorealistic interior design render of a residential room. ';

  if (style && styleDescriptions[style]) {
    prompt += `The decoration style is ${styleDescriptions[style]}. `;
  }
  if (wall_color && colorDescriptions[wall_color]) {
    prompt += `The walls are painted ${colorDescriptions[wall_color]}. `;
  }
  if (floor && floorDescriptions[floor]) {
    prompt += `The floor has ${floorDescriptions[floor]}. `;
  }
  if (custom_prompt) {
    prompt += custom_prompt + '. ';
  }

  prompt += 'Professional real estate photography, natural lighting, high quality, wide angle shot, no people.';

  try {
    const response = await client.images.generate({
      model: 'dall-e-2',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const generatedUrl = response.data[0]?.url;
    if (!generatedUrl) {
      return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 });
    }

    return NextResponse.json({
      original_url: image_url,
      generated_url: generatedUrl,
      prompt_used: prompt,
    });
  } catch (error: unknown) {
    console.error('Reimagine error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao gerar imagem. ${message}` },
      { status: 500 }
    );
  }
}
