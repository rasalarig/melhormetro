import { getAll } from "./db";

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

// Minimum score threshold for local search results
const LOCAL_SEARCH_MIN_SCORE = 15;

// Minimum score threshold for AI search results
const AI_SEARCH_MIN_SCORE = 50;

// Extract negative criteria from the query (words/phrases the user wants to EXCLUDE)
function extractNegativeCriteria(normalizedQuery: string): string[] {
  const negatives: string[] = [];

  // Patterns: "fora de X", "sem X", "nao X", "nao quero X", "sem ser X"
  const patterns = [
    /fora de\s+(\S+(?:\s+\S+)?)/g,
    /sem\s+(\S+(?:\s+\S+)?)/g,
    /nao\s+(?:quero\s+)?(\S+(?:\s+\S+)?)/g,
    /sem ser\s+(\S+(?:\s+\S+)?)/g,
    /excluir\s+(\S+(?:\s+\S+)?)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalizedQuery)) !== null) {
      negatives.push(normalize(match[1]));
    }
  }

  return negatives;
}

// Smart local search with scoring
export async function localSearch(queryText: string): Promise<SearchResult[]> {
  const properties = await getAll(
    "SELECT * FROM properties WHERE status = 'active'"
  ) as Property[];
  const normalizedQuery = normalize(queryText);

  // Extract negative criteria first
  const negativeCriteria = extractNegativeCriteria(normalizedQuery);

  // Remove negative phrases from query to get positive-only words
  let positiveQuery = normalizedQuery;
  const negPhrasePatterns = [
    /fora de\s+\S+(?:\s+\S+)?/g,
    /sem\s+\S+(?:\s+\S+)?/g,
    /nao\s+(?:quero\s+)?\S+(?:\s+\S+)?/g,
    /sem ser\s+\S+(?:\s+\S+)?/g,
    /excluir\s+\S+(?:\s+\S+)?/g,
  ];
  for (const pattern of negPhrasePatterns) {
    positiveQuery = positiveQuery.replace(pattern, " ");
  }

  const queryWords = positiveQuery.split(/\s+/).filter((w) => w.length > 2);

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
    const details = JSON.parse(property.details || "{}");
    let score = 0;
    const matchReasons: string[] = [];
    let excluded = false;

    // NEGATIVE CRITERIA CHECK: if any negative keyword is found in the property, exclude it
    for (const neg of negativeCriteria) {
      const negNorm = normalize(neg);
      // Check in searchable text (title, description, characteristics, details, etc.)
      if (searchableText.includes(negNorm)) {
        excluded = true;
        break;
      }
      // Special handling for "condominio" - also check details.gated_community
      if (negNorm.includes("condominio")) {
        if (
          details.gated_community === true ||
          details.gated_community === "true" ||
          details.gated_community === "sim" ||
          normalizedChars.some(
            (c) => c.includes("condominio") || c.includes("fechado")
          ) ||
          normalize(property.neighborhood || "").includes("condominio")
        ) {
          excluded = true;
          break;
        }
      }
    }

    if (excluded) {
      continue; // Skip this property entirely
    }

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
    const priceMatch = queryText.match(
      /(?:ate|até|menos de|abaixo de|max|máximo)\s*(?:r\$?)?\s*([\d.,]+)/i
    );
    if (priceMatch) {
      const maxPrice = parseFloat(
        priceMatch[1].replace(/\./g, "").replace(",", ".")
      );
      if (property.price <= maxPrice) {
        score += 15;
        matchReasons.push(
          `Preco dentro do orcamento (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(property.price)})`
        );
      }
    }

    // Area-related queries
    const areaMatch = queryText.match(
      /(?:mais de|acima de|minimo|mínimo)\s*(\d+)\s*m/i
    );
    if (areaMatch) {
      const minArea = parseInt(areaMatch[1]);
      if (property.area >= minArea) {
        score += 12;
        matchReasons.push(`Area de ${property.area}m2 atende o minimo`);
      }
    }

    // If no specific reasons found but score > 0, add generic
    if (score > 0 && matchReasons.length === 0) {
      matchReasons.push("Corresponde a sua busca por termos gerais");
    }

    // Deduplicate reasons
    const uniqueReasons = Array.from(new Set(matchReasons));

    // Only include results above minimum score threshold
    if (score >= LOCAL_SEARCH_MIN_SCORE) {
      results.push({ property, score, matchReasons: uniqueReasons });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// AI-enhanced search using OpenAI GPT
export async function openaiSearch(queryText: string): Promise<SearchResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return aiSearch(queryText); // Try Claude, then local
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey });

    const properties = await getAll(
      "SELECT * FROM properties WHERE status = 'active'"
    ) as Property[];

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
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Voce e um assistente de busca imobiliaria. Analise a busca do usuario e retorne os imoveis que correspondem.

REGRAS DE PONTUACAO:

1. TIPO DO IMOVEL (criterio principal):
   - Se o usuario busca "casa", retorne TODOS os imoveis com type="casa" com score 85+
   - Se o usuario busca "terreno", retorne TODOS os imoveis com type="terreno" com score 85+
   - Se a busca e apenas o tipo (ex: so "casa" ou so "terreno"), TODOS desse tipo recebem score 90.

2. CRITERIOS ADICIONAIS (ajustam o score):
   - "terrea" = verifique se tem "terrea" ou "térrea" nas characteristics. Se nao tem, reduza score em 30.
   - "X quartos" = verifique details.bedrooms. Se nao bate, reduza score em 30.
   - "piscina" ou "com piscina" = verifique se tem "piscina" nas characteristics. Se nao tem, reduza score em 30.
   - "com X" = verifique se X existe nas characteristics, description ou details. Se nao, reduza score em 20.

3. CRITERIOS NEGATIVOS (ABSOLUTOS - score 0 se violado):
   - "fora de condominio" ou "sem condominio" = EXCLUIR (score 0) qualquer imovel que tenha "condominio" ou "condomínio" no title, description, characteristics, neighborhood OU que tenha details.gated_community=true
   - "sem piscina" = EXCLUIR (score 0) qualquer imovel com piscina
   - "sem X" / "fora de X" / "nao quero X" = EXCLUIR (score 0) qualquer imovel que tenha X
   - Criterios negativos sao ABSOLUTOS: qualquer violacao = score 0, nao incluir.

4. RESULTADO VAZIO E VALIDO:
   - Se nenhum imovel corresponde, retorne { "results": [] }

5. Responda em portugues brasileiro.

Retorne APENAS JSON: { "results": [{ "id": number, "score": 50-100, "reasons": ["razao 1", "razao 2"] }] }`,
        },
        {
          role: "user",
          content: `Busca do usuario: "${queryText}"

Imoveis disponiveis:
${JSON.stringify(propertySummaries, null, 2)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return localSearch(queryText);

    const parsed = JSON.parse(content) as {
      results: Array<{ id: number; score: number; reasons: string[] }>;
    };

    return parsed.results
      .filter((r) => r.score >= AI_SEARCH_MIN_SCORE)
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
    return aiSearch(queryText); // Try Claude, then local
  }
}

// AI-enhanced search using Claude API
export async function aiSearch(queryText: string): Promise<SearchResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback to local search
    return localSearch(queryText);
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const properties = await getAll(
      "SELECT * FROM properties WHERE status = 'active'"
    ) as Property[];

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
          content: `Voce e um assistente de busca imobiliaria. Analise a busca do usuario e retorne os imoveis que correspondem.

Busca do usuario: "${queryText}"

REGRAS DE PONTUACAO:

1. TIPO DO IMOVEL (criterio principal):
   - Se o usuario busca "casa", retorne TODOS os imoveis com type="casa" com score 85+
   - Se o usuario busca "terreno", retorne TODOS os imoveis com type="terreno" com score 85+
   - Se a busca e apenas o tipo (ex: so "casa" ou so "terreno"), TODOS desse tipo recebem score 90.

2. CRITERIOS ADICIONAIS (ajustam o score):
   - "terrea" = verifique se tem "terrea" ou "térrea" nas characteristics. Se nao tem, reduza score em 30.
   - "X quartos" = verifique details.bedrooms. Se nao bate, reduza score em 30.
   - "piscina" ou "com piscina" = verifique se tem "piscina" nas characteristics. Se nao tem, reduza score em 30.
   - "com X" = verifique se X existe nas characteristics, description ou details. Se nao, reduza score em 20.

3. CRITERIOS NEGATIVOS (ABSOLUTOS - score 0 se violado):
   - "fora de condominio" ou "sem condominio" = EXCLUIR (score 0) qualquer imovel que tenha "condominio" ou "condomínio" no title, description, characteristics, neighborhood OU que tenha details.gated_community=true
   - "sem piscina" = EXCLUIR (score 0) qualquer imovel com piscina
   - "sem X" / "fora de X" / "nao quero X" = EXCLUIR (score 0) qualquer imovel que tenha X
   - Criterios negativos sao ABSOLUTOS: qualquer violacao = score 0, nao incluir.

4. RESULTADO VAZIO E VALIDO:
   - Se nenhum imovel corresponde, retorne []

Imoveis disponiveis:
${JSON.stringify(propertySummaries, null, 2)}

Retorne APENAS um JSON array (sem markdown, sem texto extra): [{ "id": number, "score": 50-100, "reasons": ["razao 1"] }]
Se nenhum combinar, retorne [].`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return localSearch(queryText);

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const aiResults = JSON.parse(jsonText) as Array<{
      id: number;
      score: number;
      reasons: string[];
    }>;

    return aiResults
      .filter((r) => r.score >= AI_SEARCH_MIN_SCORE)
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
    return localSearch(queryText);
  }
}
