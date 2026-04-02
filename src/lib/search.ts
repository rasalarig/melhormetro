import db from "./db";

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
  characteristics: string;
  details: string;
  status: string;
}

interface SearchResult {
  property: Property;
  score: number;
  matchReasons: string[];
}

// Normalize text for comparison (remove accents, lowercase)
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Extract all searchable text from a property
function getSearchableText(property: Property): string {
  const chars = JSON.parse(property.characteristics || "[]") as string[];
  const details = JSON.parse(property.details || "{}");

  const parts = [
    property.title,
    property.description,
    property.type,
    property.address,
    property.city,
    property.state,
    property.neighborhood || "",
    ...chars,
    ...Object.entries(details).map(([k, v]) => `${k} ${v}`),
  ];

  return normalize(parts.join(" "));
}

// Smart local search with scoring
export function localSearch(query: string): SearchResult[] {
  const properties = db
    .prepare("SELECT * FROM properties WHERE status = 'active'")
    .all() as Property[];
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

  // Common synonyms/related terms in Portuguese real estate
  const synonyms: Record<string, string[]> = {
    barato: ["baixo preco", "economico", "acessivel"],
    caro: ["alto padrao", "luxo", "premium"],
    grande: ["amplo", "espacoso", "generoso"],
    pequeno: ["compacto", "menor"],
    seguro: ["seguranca", "condominio fechado", "portaria"],
    verde: ["arvores", "vegetacao", "mata", "jardim", "area verde"],
    arvore: [
      "arvores",
      "frutiferas",
      "mangueira",
      "jabuticabeira",
      "vegetacao",
    ],
    fruta: ["frutiferas", "mangueira", "jabuticabeira", "pomar"],
    perto: ["proximo", "perto de"],
    escola: ["proximo escola", "perto escola"],
    comercio: ["proximo comercio", "perto comercio"],
    plano: ["terreno plano", "sem aclive"],
    vista: ["vista panoramica", "vista privilegiada"],
    tranquilo: ["calmo", "residencial", "rua sem saida"],
    familia: ["familiar", "seguro", "criancas"],
    natureza: ["arvores", "verde", "serra", "mata", "area verde"],
    condominio: ["condominio fechado", "seguranca 24h"],
    documentacao: ["documentacao ok", "escritura", "pronto transferencia"],
    construir: ["pronto para construir", "terreno plano"],
  };

  const results: SearchResult[] = [];

  for (const property of properties) {
    const searchableText = getSearchableText(property);
    const chars = JSON.parse(property.characteristics || "[]") as string[];
    const normalizedChars = chars.map(normalize);
    let score = 0;
    const matchReasons: string[] = [];

    // Direct word matching
    for (const word of queryWords) {
      if (searchableText.includes(word)) {
        score += 10;

        // Check if it matches a characteristic specifically (higher weight)
        if (normalizedChars.some((c) => c.includes(word))) {
          score += 5;
          const matchedChar = chars.find((_, i) =>
            normalizedChars[i].includes(word)
          );
          if (matchedChar) matchReasons.push(`Possui "${matchedChar}"`);
        }

        // Title match (highest weight)
        if (normalize(property.title).includes(word)) {
          score += 8;
        }

        // City/location match
        if (
          normalize(property.city).includes(word) ||
          normalize(property.neighborhood || "").includes(word)
        ) {
          score += 7;
          matchReasons.push(
            `Localizado em ${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ""}`
          );
        }

        // Type match
        if (normalize(property.type).includes(word)) {
          score += 10;
          matchReasons.push(`Tipo: ${property.type}`);
        }
      }

      // Synonym matching
      const wordSynonyms = synonyms[word] || [];
      for (const synonym of wordSynonyms) {
        if (searchableText.includes(normalize(synonym))) {
          score += 7;
          const matchedChar = chars.find((_, i) =>
            normalizedChars[i].includes(normalize(synonym))
          );
          if (matchedChar) matchReasons.push(`Possui "${matchedChar}"`);
        }
      }
    }

    // Price-related queries
    const priceMatch = query.match(
      /(?:ate|até|menos de|abaixo de|max|máximo)\s*(?:r\$?)?\s*([\d.,]+)/i
    );
    if (priceMatch) {
      const maxPrice = parseFloat(
        priceMatch[1].replace(/\./g, "").replace(",", ".")
      );
      if (property.price <= maxPrice) {
        score += 15;
        matchReasons.push(
          `Preço dentro do orçamento (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(property.price)})`
        );
      }
    }

    // Area-related queries
    const areaMatch = query.match(
      /(?:mais de|acima de|minimo|mínimo)\s*(\d+)\s*m/i
    );
    if (areaMatch) {
      const minArea = parseInt(areaMatch[1]);
      if (property.area >= minArea) {
        score += 12;
        matchReasons.push(`Área de ${property.area}m² atende o mínimo`);
      }
    }

    // If no specific reasons found but score > 0, add generic
    if (score > 0 && matchReasons.length === 0) {
      matchReasons.push("Corresponde à sua busca por termos gerais");
    }

    // Deduplicate reasons
    const uniqueReasons = Array.from(new Set(matchReasons));

    if (score > 0) {
      results.push({ property, score, matchReasons: uniqueReasons });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// AI-enhanced search using OpenAI GPT
export async function openaiSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return aiSearch(query); // Try Claude, then local
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });

    const properties = db
      .prepare("SELECT * FROM properties WHERE status = 'active'")
      .all() as Property[];

    if (properties.length === 0) return [];

    const propertySummaries = properties.map((p) => {
      const chars = JSON.parse(p.characteristics || "[]");
      const details = JSON.parse(p.details || "{}");
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        area: p.area,
        type: p.type,
        city: p.city,
        state: p.state,
        neighborhood: p.neighborhood,
        address: p.address,
        characteristics: chars,
        details,
      };
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um assistente especialista em busca imobiliária. Sua função é analisar imóveis disponíveis e determinar quais combinam com o que o usuário está procurando.

REGRAS:
- Analise TODOS os campos: título, descrição, características, localização, preço, área, detalhes
- Seja generoso: se há qualquer relação entre a busca e o imóvel, inclua-o
- Para cada resultado, explique de forma clara e amigável POR QUE combina
- Entenda contexto implícito: "lugar tranquilo pra família" = residencial, seguro, tranquilo
- Entenda buscas por investimento: "bom investimento" = preço acessível, área grande, documentação ok
- Sempre responda em português brasileiro

Retorne APENAS JSON no formato: { "results": [{ "id": number, "score": 0-100, "reasons": ["razão 1", "razão 2"] }] }
Se nenhum imóvel combinar, retorne { "results": [] }.`,
        },
        {
          role: "user",
          content: `Busca do usuário: "${query}"

Imóveis disponíveis:
${JSON.stringify(propertySummaries, null, 2)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return localSearch(query);

    const parsed = JSON.parse(content) as {
      results: Array<{ id: number; score: number; reasons: string[] }>;
    };

    return parsed.results
      .map((r) => {
        const property = properties.find((p) => p.id === r.id);
        if (!property) return null;
        return {
          property,
          score: r.score,
          matchReasons: r.reasons,
        };
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("OpenAI search failed, falling back:", error);
    return aiSearch(query); // Try Claude, then local
  }
}

// AI-enhanced search using Claude API
export async function aiSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback to local search
    return localSearch(query);
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const properties = db
      .prepare("SELECT * FROM properties WHERE status = 'active'")
      .all() as Property[];

    // Build property summaries for the AI
    const propertySummaries = properties.map((p) => {
      const chars = JSON.parse(p.characteristics || "[]");
      const details = JSON.parse(p.details || "{}");
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        area: p.area,
        type: p.type,
        city: p.city,
        neighborhood: p.neighborhood,
        characteristics: chars,
        details,
      };
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Você é um assistente de busca imobiliária. O usuário está procurando um imóvel com a seguinte descrição:

"${query}"

Aqui estão os imóveis disponíveis:
${JSON.stringify(propertySummaries, null, 2)}

Para cada imóvel que combina com a busca do usuário, retorne um JSON array com objetos contendo:
- "id": o ID do imóvel
- "score": nota de 0 a 100 de relevância
- "reasons": array de strings explicando POR QUE esse imóvel combina com a busca (em português, de forma clara e amigável)

Retorne APENAS o JSON array, sem markdown ou explicações extras. Se nenhum imóvel combinar, retorne [].
Seja generoso na busca — se há alguma relação entre a busca e o imóvel, inclua-o com score apropriado.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return localSearch(query);

    const aiResults = JSON.parse(content.text) as Array<{
      id: number;
      score: number;
      reasons: string[];
    }>;

    return aiResults
      .map((r) => {
        const property = properties.find((p) => p.id === r.id);
        if (!property) return null;
        return {
          property,
          score: r.score,
          matchReasons: r.reasons,
        };
      })
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("AI search failed, falling back to local:", error);
    return localSearch(query);
  }
}
