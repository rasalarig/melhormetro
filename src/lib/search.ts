import { getAll } from "./db";

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface SearchFilters {
  type: string[] | null;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_parking: number | null;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  must_have: string[];
  must_not_have: string[];
  keywords: string[];
  exclude_keywords: string[];
  sort_by: "relevance" | "price_asc" | "price_desc" | "area_asc" | "area_desc" | "newest";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const FILTER_GENERATION_PROMPT = `You are a real estate search assistant for Brazil. Given a user's search query in Portuguese (or any language), extract structured search filters.

IMPORTANT RULES:
- "X metros" or "X m2" means area in square meters
- "X quartos" or "X dormitórios" means bedrooms
- "X banheiros" means bathrooms
- "X vagas" means parking spots
- "até X" or "menos de X" means maximum
- "mais de X" or "acima de X" means minimum
- "de X metros" without "mais/menos" means approximately that area (set min to 90% and max to 110%)
- Price: "500 mil" = 500000, "1 milhão" = 1000000, "1.5 milhão" = 1500000
- "barato" = max_price contextual (under 300000 for apartments, under 500000 for houses)
- "caro" or "alto padrão" or "luxo" = min_price contextual (above 800000)
- "sem X" or "fora de X" or "não quero X" = must_not_have or exclude
- "perto de X" or "próximo a X" = add X to keywords
- "em [city]" or "no [neighborhood]" = set city/neighborhood filter
- "casa" -> type includes "casa", "apartamento" -> type includes "apartamento", "terreno" -> type includes "terreno"
- "casa térrea" -> type includes "casa", must_have includes "térrea" or "terrea"
- If the user mentions a property type, set it. If not, leave null (any type).
- Always return valid JSON. Never return text outside the JSON.
- When query is just a type like "casa" or "terreno", only set the type filter. Leave everything else null/empty.

Return ONLY this JSON structure (no markdown, no explanation, no extra text):
{
  "type": ["casa"] or ["apartamento"] or null,
  "min_price": number or null,
  "max_price": number or null,
  "min_area": number or null,
  "max_area": number or null,
  "min_bedrooms": number or null,
  "min_bathrooms": number or null,
  "min_parking": number or null,
  "city": "city name" or null,
  "neighborhood": "neighborhood name" or null,
  "state": "SP" or null,
  "must_have": ["piscina", "churrasqueira"],
  "must_not_have": ["condominio fechado"],
  "keywords": ["vista", "serra"],
  "exclude_keywords": [],
  "sort_by": "relevance"
}

EXAMPLES:
Query: "casa até 500 mil com piscina"
{"type":["casa"],"min_price":null,"max_price":500000,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":["piscina"],"must_not_have":[],"keywords":[],"exclude_keywords":[],"sort_by":"price_asc"}

Query: "apartamento de 100 metros com 3 quartos"
{"type":["apartamento"],"min_price":null,"max_price":null,"min_area":90,"max_area":110,"min_bedrooms":3,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":[],"must_not_have":[],"keywords":[],"exclude_keywords":[],"sort_by":"relevance"}

Query: "terreno em Atibaia fora de condomínio"
{"type":["terreno"],"min_price":null,"max_price":null,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":"Atibaia","neighborhood":null,"state":null,"must_have":[],"must_not_have":["condominio","condomínio"],"keywords":[],"exclude_keywords":["condominio","condomínio"],"sort_by":"relevance"}

Query: "casa térrea barata com churrasqueira sem condomínio"
{"type":["casa"],"min_price":null,"max_price":500000,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":["terrea","churrasqueira"],"must_not_have":["condominio","condomínio"],"keywords":[],"exclude_keywords":["condominio","condomínio"],"sort_by":"price_asc"}

Query: "casa sem arvores"
{"type":["casa"],"min_price":null,"max_price":null,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":[],"must_not_have":["arvore","arvores","árvore","árvores"],"keywords":[],"exclude_keywords":["arvore","arvores","árvore","árvores"],"sort_by":"relevance"}

Query: "terreno sem aclive"
{"type":["terreno"],"min_price":null,"max_price":null,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":[],"must_not_have":["aclive","aclives"],"keywords":[],"exclude_keywords":["aclive","aclives"],"sort_by":"relevance"}

Query: "casa"
{"type":["casa"],"min_price":null,"max_price":null,"min_area":null,"max_area":null,"min_bedrooms":null,"min_bathrooms":null,"min_parking":null,"city":null,"neighborhood":null,"state":null,"must_have":[],"must_not_have":[],"keywords":[],"exclude_keywords":[],"sort_by":"relevance"}

CRITICAL: When the user says "sem X" (without X), you MUST add X and all its variations (with/without accents, singular/plural) to BOTH must_not_have AND exclude_keywords. This ensures properties containing X in ANY field are excluded. Never put exclusion terms in keywords or must_have.`;

// ─── Step 1: AI Generates Structured Filters ─────────────────────────────────

async function aiGenerateFilters(queryText: string): Promise<SearchFilters> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Try OpenAI first
  if (openaiKey) {
    try {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey: openaiKey });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: FILTER_GENERATION_PROMPT },
          { role: "user", content: queryText },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const filters = JSON.parse(content) as SearchFilters;
        console.log("[Search] AI filters (OpenAI):", JSON.stringify(filters));
        return sanitizeFilters(filters);
      }
    } catch (error) {
      console.error("[Search] OpenAI filter generation failed:", error);
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
          {
            role: "user",
            content: `${FILTER_GENERATION_PROMPT}\n\nQuery: "${queryText}"`,
          },
        ],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      if (textBlock && textBlock.type === "text") {
        let jsonText = textBlock.text.trim();
        // Strip markdown code blocks if present
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
        const filters = JSON.parse(jsonText) as SearchFilters;
        console.log("[Search] AI filters (Claude):", JSON.stringify(filters));
        return sanitizeFilters(filters);
      }
    } catch (error) {
      console.error("[Search] Claude filter generation failed:", error);
    }
  }

  // No AI available — return empty filters (will match everything, scored by keywords)
  console.log("[Search] No AI available, returning empty filters");
  return getEmptyFilters();
}

function getEmptyFilters(): SearchFilters {
  return {
    type: null,
    min_price: null,
    max_price: null,
    min_area: null,
    max_area: null,
    min_bedrooms: null,
    min_bathrooms: null,
    min_parking: null,
    city: null,
    neighborhood: null,
    state: null,
    must_have: [],
    must_not_have: [],
    keywords: [],
    exclude_keywords: [],
    sort_by: "relevance",
  };
}

function sanitizeFilters(filters: SearchFilters): SearchFilters {
  const mustNotHave = Array.isArray(filters.must_not_have) ? filters.must_not_have : [];
  const excludeKeywords = Array.isArray(filters.exclude_keywords) ? filters.exclude_keywords : [];

  // Ensure everything in must_not_have is also in exclude_keywords (belt and suspenders)
  const mergedExclude = Array.from(new Set([...excludeKeywords, ...mustNotHave]));

  return {
    type: Array.isArray(filters.type) && filters.type.length > 0 ? filters.type.map((t) => t.toLowerCase()) : null,
    min_price: typeof filters.min_price === "number" ? filters.min_price : null,
    max_price: typeof filters.max_price === "number" ? filters.max_price : null,
    min_area: typeof filters.min_area === "number" ? filters.min_area : null,
    max_area: typeof filters.max_area === "number" ? filters.max_area : null,
    min_bedrooms: typeof filters.min_bedrooms === "number" ? filters.min_bedrooms : null,
    min_bathrooms: typeof filters.min_bathrooms === "number" ? filters.min_bathrooms : null,
    min_parking: typeof filters.min_parking === "number" ? filters.min_parking : null,
    city: typeof filters.city === "string" ? filters.city : null,
    neighborhood: typeof filters.neighborhood === "string" ? filters.neighborhood : null,
    state: typeof filters.state === "string" ? filters.state : null,
    must_have: Array.isArray(filters.must_have) ? filters.must_have : [],
    must_not_have: mustNotHave,
    keywords: Array.isArray(filters.keywords) ? filters.keywords : [],
    exclude_keywords: mergedExclude,
    sort_by: filters.sort_by || "relevance",
  };
}

// ─── Step 2: Apply Filters to Properties ─────────────────────────────────────

function applyFilters(filters: SearchFilters, properties: Property[]): SearchResult[] {
  return properties
    .map((property) => {
      let score = 100;
      const reasons: string[] = [];

      const chars: string[] = (() => {
        try {
          return (JSON.parse(property.characteristics || "[]") as string[]).map((c) => c.toLowerCase());
        } catch {
          return [];
        }
      })();

      const details: Record<string, unknown> = (() => {
        try {
          return JSON.parse(property.details || "{}");
        } catch {
          return {};
        }
      })();

      const searchText = [
        property.title,
        property.description,
        property.neighborhood || "",
        property.address || "",
        ...chars,
      ]
        .join(" ")
        .toLowerCase();

      const searchTextNorm = normalize(searchText);

      // ── Type filter (mandatory if specified) ──
      if (filters.type && filters.type.length > 0) {
        const propType = property.type.toLowerCase();
        if (!filters.type.some((t) => propType.includes(t) || t.includes(propType))) {
          return null; // Hard exclude
        }
        reasons.push(`Tipo: ${property.type}`);
      }

      // ── Price filters (mandatory) ──
      if (filters.min_price !== null && property.price < filters.min_price) return null;
      if (filters.max_price !== null && property.price > filters.max_price) return null;
      if (filters.min_price !== null || filters.max_price !== null) {
        reasons.push(
          `Preço: R$ ${property.price.toLocaleString("pt-BR")}`
        );
      }

      // ── Area filters (mandatory) ──
      if (filters.min_area !== null && property.area < filters.min_area) return null;
      if (filters.max_area !== null && property.area > filters.max_area) return null;
      if (filters.min_area !== null || filters.max_area !== null) {
        reasons.push(`Área: ${property.area}m²`);
      }

      // ── Bedrooms (mandatory if specified) ──
      if (filters.min_bedrooms !== null) {
        const propBedrooms = (details.bedrooms as number) || 0;
        if (propBedrooms < filters.min_bedrooms) return null;
        reasons.push(`${propBedrooms} quartos`);
      }

      // ── Bathrooms (mandatory if specified) ──
      if (filters.min_bathrooms !== null) {
        const propBathrooms = (details.bathrooms as number) || 0;
        if (propBathrooms < filters.min_bathrooms) return null;
        reasons.push(`${propBathrooms} banheiros`);
      }

      // ── Parking (mandatory if specified) ──
      if (filters.min_parking !== null) {
        const propParking = (details.parking as number) || 0;
        if (propParking < filters.min_parking) return null;
        reasons.push(`${propParking} vagas`);
      }

      // ── City filter — also check neighborhood (AI sometimes confuses them) ──
      if (filters.city) {
        const cityNorm = normalize(filters.city);
        const propCity = normalize(property.city);
        const propNeigh = normalize(property.neighborhood || "");
        const propAddr = normalize(property.address || "");
        const matchesCity = propCity.includes(cityNorm) || cityNorm.includes(propCity);
        const matchesNeigh = propNeigh.includes(cityNorm) || cityNorm.includes(propNeigh);
        const matchesAddr = propAddr.includes(cityNorm);
        if (!matchesCity && !matchesNeigh && !matchesAddr) return null;
        reasons.push(matchesCity ? `Cidade: ${property.city}` : `Bairro: ${property.neighborhood}`);
      }

      // ── Neighborhood filter — also check city ──
      if (filters.neighborhood) {
        const neighNorm = normalize(filters.neighborhood);
        const propNeigh = normalize(property.neighborhood || "");
        const propCity = normalize(property.city);
        const matchesNeigh = propNeigh.includes(neighNorm) || neighNorm.includes(propNeigh);
        const matchesCity = propCity.includes(neighNorm) || neighNorm.includes(propCity);
        if (!matchesNeigh && !matchesCity) return null;
        reasons.push(`Bairro: ${property.neighborhood || property.city}`);
      }

      // ── State filter (mandatory if specified) ──
      if (filters.state) {
        const stateNorm = normalize(filters.state);
        const propState = normalize(property.state);
        if (!propState.includes(stateNorm) && !stateNorm.includes(propState)) return null;
      }

      // ── Must-have characteristics (mandatory) ──
      for (const must of filters.must_have) {
        const mustNorm = normalize(must);
        const found =
          chars.some((c) => normalize(c).includes(mustNorm)) ||
          searchTextNorm.includes(mustNorm);
        if (!found) return null; // Hard exclude
        reasons.push(`Possui "${must}"`);
      }

      // ── Must-NOT-have characteristics (mandatory exclusion) ──
      for (const mustNot of filters.must_not_have) {
        const mustNotNorm = normalize(mustNot);
        // Check characteristics
        const foundInChars = chars.some((c) => normalize(c).includes(mustNotNorm));
        // Check full text
        const foundInText = searchTextNorm.includes(mustNotNorm);
        // Check details.gated_community for condominio
        const isCondoExclusion = mustNotNorm.includes("condominio");
        const foundInDetails =
          isCondoExclusion &&
          (details.gated_community === true ||
            details.gated_community === "true" ||
            details.gated_community === "sim");

        if (foundInChars || foundInText || foundInDetails) return null; // Hard exclude
      }

      // ── Keywords (bonus scoring, not mandatory) ──
      for (const kw of filters.keywords) {
        const kwNorm = normalize(kw);
        if (
          searchTextNorm.includes(kwNorm) ||
          chars.some((c) => normalize(c).includes(kwNorm))
        ) {
          score += 10;
          reasons.push(`Contém "${kw}"`);
        }
      }

      // ── Exclude keywords (mandatory exclusion) ──
      for (const kw of filters.exclude_keywords) {
        const kwNorm = normalize(kw);
        if (searchTextNorm.includes(kwNorm)) return null;
      }

      if (reasons.length === 0) {
        reasons.push("Corresponde à sua busca");
      }

      return { property, score, matchReasons: reasons };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => {
      if (filters.sort_by === "price_asc") return a.property.price - b.property.price;
      if (filters.sort_by === "price_desc") return b.property.price - a.property.price;
      if (filters.sort_by === "area_asc") return a.property.area - b.property.area;
      if (filters.sort_by === "area_desc") return b.property.area - a.property.area;
      // Default: sort by score descending
      return b.score - a.score;
    });
}

// ─── Manual Filters (from UI filter panel) ───────────────────────────────────

export interface ManualSearchFilters {
  types?: string[];
  min_price?: number | null;
  max_price?: number | null;
  min_area?: number | null;
  max_area?: number | null;
  min_bedrooms?: number | null;
  min_bathrooms?: number | null;
  min_parking?: number | null;
  city?: string;
  neighborhood?: string;
  characteristics?: string[];
  sort_by?: string;
}

function mergeManualFilters(
  aiFilters: SearchFilters,
  manual: ManualSearchFilters
): SearchFilters {
  const merged = { ...aiFilters };

  // Manual filters override AI filters when set
  if (manual.types && manual.types.length > 0) {
    merged.type = manual.types.map((t) => t.toLowerCase());
  }
  if (manual.min_price !== undefined && manual.min_price !== null) {
    merged.min_price = manual.min_price;
  }
  if (manual.max_price !== undefined && manual.max_price !== null) {
    merged.max_price = manual.max_price;
  }
  if (manual.min_area !== undefined && manual.min_area !== null) {
    merged.min_area = manual.min_area;
  }
  if (manual.max_area !== undefined && manual.max_area !== null) {
    merged.max_area = manual.max_area;
  }
  if (manual.min_bedrooms !== undefined && manual.min_bedrooms !== null) {
    merged.min_bedrooms = manual.min_bedrooms;
  }
  if (manual.min_bathrooms !== undefined && manual.min_bathrooms !== null) {
    merged.min_bathrooms = manual.min_bathrooms;
  }
  if (manual.min_parking !== undefined && manual.min_parking !== null) {
    merged.min_parking = manual.min_parking;
  }
  if (manual.city && manual.city.trim()) {
    merged.city = manual.city.trim();
  }
  if (manual.neighborhood && manual.neighborhood.trim()) {
    merged.neighborhood = manual.neighborhood.trim();
  }
  if (manual.characteristics && manual.characteristics.length > 0) {
    // Merge: add manual characteristics to must_have (deduplicate)
    const existing = new Set(merged.must_have.map((m) => m.toLowerCase()));
    for (const char of manual.characteristics) {
      if (!existing.has(char.toLowerCase())) {
        merged.must_have.push(char.toLowerCase());
      }
    }
  }
  if (manual.sort_by && manual.sort_by !== "relevance") {
    merged.sort_by = manual.sort_by as SearchFilters["sort_by"];
  }

  return merged;
}

function manualToSearchFilters(manual: ManualSearchFilters): SearchFilters {
  return {
    type:
      manual.types && manual.types.length > 0
        ? manual.types.map((t) => t.toLowerCase())
        : null,
    min_price: manual.min_price ?? null,
    max_price: manual.max_price ?? null,
    min_area: manual.min_area ?? null,
    max_area: manual.max_area ?? null,
    min_bedrooms: manual.min_bedrooms ?? null,
    min_bathrooms: manual.min_bathrooms ?? null,
    min_parking: manual.min_parking ?? null,
    city: manual.city?.trim() || null,
    neighborhood: manual.neighborhood?.trim() || null,
    state: null,
    must_have: (manual.characteristics || []).map((c) => c.toLowerCase()),
    must_not_have: [],
    keywords: [],
    exclude_keywords: [],
    sort_by: (manual.sort_by as SearchFilters["sort_by"]) || "relevance",
  };
}

// ─── Main Search: Two-Step AI Search ─────────────────────────────────────────

export async function openaiSearch(
  queryText: string,
  manualOverrides?: ManualSearchFilters
): Promise<SearchResult[]> {
  const properties = (await getAll(
    "SELECT * FROM properties WHERE status = 'active' AND (approved = 'approved' OR approved IS NULL)"
  )) as Property[];

  if (properties.length === 0) return [];

  try {
    // Step 1: AI generates structured filters
    let filters = await aiGenerateFilters(queryText);

    // Step 1.5: Merge manual overrides if provided
    if (manualOverrides) {
      filters = mergeManualFilters(filters, manualOverrides);
      console.log("[Search] Merged manual overrides into AI filters");
    }

    // Step 2: Apply filters to all properties
    const results = applyFilters(filters, properties);

    console.log("[Search] Results:", results.length, "out of", properties.length, "properties");
    return results;
  } catch (error) {
    console.error("[Search] Two-step search failed, falling back to local:", error);
    return localSearch(queryText, properties);
  }
}

// ─── Filter-Only Search (no AI, just manual filters) ─────────────────────────

export async function filterSearch(
  manual: ManualSearchFilters,
  keywordQuery?: string
): Promise<SearchResult[]> {
  const properties = (await getAll(
    "SELECT * FROM properties WHERE status = 'active' AND (approved = 'approved' OR approved IS NULL)"
  )) as Property[];

  if (properties.length === 0) return [];

  const filters = manualToSearchFilters(manual);
  console.log("[Search] Filter-only search:", JSON.stringify(filters));

  let results = applyFilters(filters, properties);

  // If there's a keyword query, boost properties matching the keywords
  if (keywordQuery && keywordQuery.trim()) {
    const queryNorm = normalize(keywordQuery);
    const queryWords = queryNorm.split(/\s+/).filter((w) => w.length > 2);

    if (queryWords.length > 0) {
      results = results.map((r) => {
        const searchText = normalize(
          [
            r.property.title,
            r.property.description,
            r.property.type,
            r.property.address,
            r.property.city,
            r.property.neighborhood || "",
          ].join(" ")
        );

        let bonus = 0;
        for (const word of queryWords) {
          if (searchText.includes(word)) {
            bonus += 10;
          }
        }

        return {
          ...r,
          score: r.score + bonus,
          matchReasons: bonus > 0
            ? [...r.matchReasons, "Corresponde por palavras-chave"]
            : r.matchReasons,
        };
      });

      // Re-sort if sorting by relevance
      if (filters.sort_by === "relevance") {
        results.sort((a, b) => b.score - a.score);
      }
    }
  }

  console.log("[Search] Filter results:", results.length, "out of", properties.length);
  return results;
}

// ─── Fallback: Simple Keyword Search ─────────────────────────────────────────

export async function localSearch(
  queryText: string,
  preloadedProperties?: Property[]
): Promise<SearchResult[]> {
  const properties =
    preloadedProperties ||
    ((await getAll("SELECT * FROM properties WHERE status = 'active' AND (approved = 'approved' OR approved IS NULL)")) as Property[]);

  const queryNorm = normalize(queryText);
  const queryWords = queryNorm.split(/\s+/).filter((w) => w.length > 2);

  if (queryWords.length === 0) return [];

  const results: SearchResult[] = [];

  for (const property of properties) {
    const chars: string[] = (() => {
      try {
        return JSON.parse(property.characteristics || "[]") as string[];
      } catch {
        return [];
      }
    })();

    const searchText = normalize(
      [
        property.title,
        property.description,
        property.type,
        property.address,
        property.city,
        property.state,
        property.neighborhood || "",
        ...chars,
      ].join(" ")
    );

    let score = 0;
    const reasons: string[] = [];

    for (const word of queryWords) {
      if (searchText.includes(word)) {
        score += 10;

        if (normalize(property.title).includes(word)) {
          score += 5;
        }
        if (normalize(property.type).includes(word)) {
          score += 10;
          reasons.push(`Tipo: ${property.type}`);
        }
        if (
          normalize(property.city).includes(word) ||
          normalize(property.neighborhood || "").includes(word)
        ) {
          score += 7;
          reasons.push(`Localização: ${property.city}`);
        }
      }
    }

    if (score >= 10) {
      if (reasons.length === 0) reasons.push("Corresponde por palavras-chave");
      const uniqueReasons = Array.from(new Set(reasons));
      results.push({ property, score, matchReasons: uniqueReasons });
    }
  }

  results.sort((a, b) => b.score - a.score);
  console.log("[Search] Local fallback results:", results.length);
  return results;
}

// Re-export for backward compatibility
export { localSearch as aiSearch };
