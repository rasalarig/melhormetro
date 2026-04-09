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

  // Build the prompt — CRITICAL: be extremely explicit about preserving the original image
  const changes: string[] = [];

  if (style && styleDescriptions[style]) {
    changes.push(`change the decoration style to ${styleDescriptions[style]}`);
  }
  if (wall_color && colorDescriptions[wall_color]) {
    changes.push(`repaint the walls to ${colorDescriptions[wall_color]}`);
  }
  if (floor && floorDescriptions[floor]) {
    changes.push(`change the floor to ${floorDescriptions[floor]}`);
  }
  if (custom_prompt) {
    changes.push(custom_prompt);
  }

  const changesList = changes.length > 0 ? changes.join('; ') : 'subtly refresh the decor';

  const prompt = `IMPORTANT: This is a photo editing task. You MUST preserve the EXACT same room structure, walls, windows, doors, ceiling, camera angle, perspective, and lighting from the original photo. Do NOT generate a new room. Do NOT change the room layout or architecture. The result must look like the SAME room photographed from the SAME position. The ONLY changes allowed are: ${changesList}. Everything else in the photo must remain IDENTICAL to the original.`;

  try {
    // Fetch the original image and convert to a File object
    const imageResponse = await fetch(image_url);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const imageFile = new File([imageBuffer], 'room.png', { type: 'image/png' });

    const response = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt,
      size: '1024x1024',
      quality: 'low',
    });

    // gpt-image-1 edit returns base64 data by default
    const base64Image = response.data[0]?.b64_json;
    if (!base64Image) {
      return NextResponse.json({ error: 'Falha ao gerar imagem' }, { status: 500 });
    }

    const generatedUrl = `data:image/png;base64,${base64Image}`;

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
