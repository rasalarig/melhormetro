import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

interface ImageAnalysisDetail {
  detected: boolean;
  confidence: number;
  reason: string;
}

interface ImageResult {
  url: string;
  passed: boolean;
  issues: string[];
  details: {
    sexual_content: ImageAnalysisDetail;
    non_property: ImageAnalysisDetail;
    watermark: ImageAnalysisDetail;
  };
}

const SYSTEM_PROMPT = `Você é um sistema de moderação de imagens para um portal imobiliário brasileiro chamado MelhorMetro.
Sua função é analisar imagens enviadas por vendedores para verificar se são apropriadas para listagens de imóveis.

Analise cada imagem segundo três critérios:

1. **Conteúdo sexual/inapropriado** (sexual_content): Detecte imagens com nudez, conteúdo sexualmente sugestivo, ou conteúdo impróprio de qualquer tipo.

2. **Não relacionado a imóveis** (non_property): Detecte imagens que NÃO mostram imóveis, cômodos, terrenos, edificações, construções, fachadas, áreas externas de propriedades, ou vizinhança/entorno de imóveis. Exemplos de imagens INVÁLIDAS: selfies, fotos de pessoas, comida, objetos aleatórios, memes, paisagens naturais sem relação a propriedade, animais. Exemplos de imagens VÁLIDAS: quartos, salas, cozinhas, banheiros, fachadas, garagens, quintais, terrenos, construções em andamento, vistas de varandas, plantas baixas.

3. **Marca d'água** (watermark): Detecte marcas d'água visíveis de outras plataformas (ex: ZAP Imóveis, OLX, Viva Real, Imovelweb, etc.), imobiliárias concorrentes, fotógrafos, ou qualquer texto/logo sobreposto que identifique outra empresa.

Responda APENAS com um objeto JSON válido no seguinte formato:
{
  "sexual_content": { "detected": boolean, "confidence": number (0.0 a 1.0), "reason": "string em português" },
  "non_property": { "detected": boolean, "confidence": number (0.0 a 1.0), "reason": "string em português" },
  "watermark": { "detected": boolean, "confidence": number (0.0 a 1.0), "reason": "string em português" }
}

Seja criterioso mas justo. Na dúvida, prefira não bloquear imagens que claramente mostram imóveis.`;

async function analyzeImageWithOpenAI(imageUrl: string): Promise<ImageResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'low' },
          },
          {
            type: 'text',
            text: 'Analise esta imagem e responda com o JSON de moderação.',
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';

  // Extract JSON from the response (may have markdown fences)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta inválida da IA');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const details = {
    sexual_content: {
      detected: Boolean(parsed.sexual_content?.detected),
      confidence: Number(parsed.sexual_content?.confidence ?? 0),
      reason: String(parsed.sexual_content?.reason ?? ''),
    },
    non_property: {
      detected: Boolean(parsed.non_property?.detected),
      confidence: Number(parsed.non_property?.confidence ?? 0),
      reason: String(parsed.non_property?.reason ?? ''),
    },
    watermark: {
      detected: Boolean(parsed.watermark?.detected),
      confidence: Number(parsed.watermark?.confidence ?? 0),
      reason: String(parsed.watermark?.reason ?? ''),
    },
  };

  const issues: string[] = [];
  if (details.sexual_content.detected) issues.push('sexual_content');
  if (details.non_property.detected) issues.push('non_property');
  if (details.watermark.detected) issues.push('watermark');

  return {
    url: imageUrl,
    passed: issues.length === 0,
    issues,
    details,
  };
}

async function analyzeImageWithClaude(imageUrl: string): Promise<ImageResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Fetch the image and convert to base64 for Claude
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error('Falha ao buscar imagem para análise');

  const buffer = await imgResponse.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';

  // Claude accepts image/jpeg, image/png, image/gif, image/webp
  const mediaType = contentType.startsWith('image/') ? contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Analise esta imagem e responda com o JSON de moderação.',
          },
        ],
      },
    ],
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta inválida da IA (Claude)');

  const parsed = JSON.parse(jsonMatch[0]);

  const details = {
    sexual_content: {
      detected: Boolean(parsed.sexual_content?.detected),
      confidence: Number(parsed.sexual_content?.confidence ?? 0),
      reason: String(parsed.sexual_content?.reason ?? ''),
    },
    non_property: {
      detected: Boolean(parsed.non_property?.detected),
      confidence: Number(parsed.non_property?.confidence ?? 0),
      reason: String(parsed.non_property?.reason ?? ''),
    },
    watermark: {
      detected: Boolean(parsed.watermark?.detected),
      confidence: Number(parsed.watermark?.confidence ?? 0),
      reason: String(parsed.watermark?.reason ?? ''),
    },
  };

  const issues: string[] = [];
  if (details.sexual_content.detected) issues.push('sexual_content');
  if (details.non_property.detected) issues.push('non_property');
  if (details.watermark.detected) issues.push('watermark');

  return {
    url: imageUrl,
    passed: issues.length === 0,
    issues,
    details,
  };
}

async function analyzeImage(imageUrl: string): Promise<ImageResult> {
  try {
    return await analyzeImageWithOpenAI(imageUrl);
  } catch (err) {
    console.error('OpenAI moderation failed, trying Claude fallback:', err);
    return await analyzeImageWithClaude(imageUrl);
  }
}

// POST /api/moderation/analyze
// Body: { image_urls: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_urls } = body;

    if (!Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: 'image_urls deve ser um array não vazio' }, { status: 400 });
    }

    // Limit to 20 images per call
    const urls = image_urls.slice(0, 20);

    const results: ImageResult[] = await Promise.all(
      urls.map((url: string) => analyzeImage(url))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Moderation analyze error:', error);
    return NextResponse.json({ error: 'Falha na moderação de imagens' }, { status: 500 });
  }
}
