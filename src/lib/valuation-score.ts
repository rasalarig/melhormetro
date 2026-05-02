// Valuation score utility — estimates appreciation potential for a property.
// Score is 0-100, computed from 5 factors based on real Brazilian market data.

export interface ValuationFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface ValuationResult {
  score: number;
  classification: "Excepcional" | "Alto" | "Bom" | "Moderado" | "Baixo";
  color: string; // Tailwind color class prefix (e.g. "emerald")
  factors: ValuationFactor[];
  dataSource: string;
}

// Property shape expected by the scorer (subset of full property type)
export interface ScoredProperty {
  type: string;
  area: number;
  price: number;
  city: string;
  state: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  characteristics?: string | string[] | null;
  details?: string | Record<string, unknown> | null;
  condominium_id?: number | null;
  condominium_name?: string | null;
  images?: { filename?: string }[] | null;
  facade_orientation?: string | null;
}

// ─── Market reference data ─────────────────────────────────────────────────

// Real market data — R$/m² médio por cidade (venda, 2024/2025)
// Source: FipeZap Index / SECOVI / CRECI reports
const MARKET_DATA: Record<string, { apartamento: number; casa: number; terreno: number; comercial: number }> = {
  "são paulo": { apartamento: 10200, casa: 7500, terreno: 2800, comercial: 8500 },
  "rio de janeiro": { apartamento: 9800, casa: 6200, terreno: 2200, comercial: 7800 },
  "belo horizonte": { apartamento: 7500, casa: 5800, terreno: 1800, comercial: 6200 },
  "curitiba": { apartamento: 8200, casa: 6000, terreno: 2000, comercial: 6800 },
  "porto alegre": { apartamento: 7000, casa: 5200, terreno: 1600, comercial: 5800 },
  "florianópolis": { apartamento: 10500, casa: 8000, terreno: 3500, comercial: 9000 },
  "brasília": { apartamento: 9000, casa: 6500, terreno: 2500, comercial: 7500 },
  "salvador": { apartamento: 6500, casa: 4800, terreno: 1400, comercial: 5200 },
  "fortaleza": { apartamento: 6800, casa: 4500, terreno: 1200, comercial: 5000 },
  "recife": { apartamento: 7200, casa: 5000, terreno: 1500, comercial: 5500 },
  "goiânia": { apartamento: 6000, casa: 4200, terreno: 1300, comercial: 4800 },
  "campinas": { apartamento: 7800, casa: 5500, terreno: 2200, comercial: 6500 },
  "santos": { apartamento: 8500, casa: 6000, terreno: 2500, comercial: 7000 },
  "ribeirão preto": { apartamento: 6500, casa: 4800, terreno: 1800, comercial: 5500 },
  "sorocaba": { apartamento: 5800, casa: 4200, terreno: 1500, comercial: 4800 },
  "são josé dos campos": { apartamento: 6800, casa: 5000, terreno: 2000, comercial: 5800 },
  "londrina": { apartamento: 5500, casa: 4000, terreno: 1200, comercial: 4500 },
  "maringá": { apartamento: 6000, casa: 4500, terreno: 1500, comercial: 5000 },
  "joinville": { apartamento: 6200, casa: 4800, terreno: 1600, comercial: 5200 },
  "balneário camboriú": { apartamento: 14000, casa: 9000, terreno: 5000, comercial: 10000 },
  "natal": { apartamento: 5800, casa: 4000, terreno: 1100, comercial: 4500 },
  "vitória": { apartamento: 7800, casa: 5500, terreno: 2000, comercial: 6200 },
  "manaus": { apartamento: 5200, casa: 3800, terreno: 1000, comercial: 4200 },
  "belém": { apartamento: 5500, casa: 3500, terreno: 900, comercial: 4000 },
  "campo grande": { apartamento: 5000, casa: 3500, terreno: 800, comercial: 3800 },
  "cuiabá": { apartamento: 5500, casa: 4000, terreno: 1000, comercial: 4500 },
  "jundiaí": { apartamento: 6500, casa: 5000, terreno: 2000, comercial: 5500 },
  "piracicaba": { apartamento: 5500, casa: 4000, terreno: 1400, comercial: 4500 },
};

// National average fallback
const NATIONAL_AVG = { apartamento: 7000, casa: 5000, terreno: 1500, comercial: 5500 };

// Annual appreciation rate by city (% real, 2023-2024)
// Source: FipeZap Index
const APPRECIATION_RATES: Record<string, number> = {
  "são paulo": 5.8,
  "rio de janeiro": 4.2,
  "belo horizonte": 7.1,
  "curitiba": 8.5,
  "porto alegre": 3.2,
  "florianópolis": 9.2,
  "brasília": 6.0,
  "salvador": 4.5,
  "fortaleza": 5.0,
  "recife": 4.8,
  "goiânia": 11.5,
  "campinas": 7.0,
  "santos": 6.5,
  "ribeirão preto": 7.8,
  "sorocaba": 6.2,
  "são josé dos campos": 7.5,
  "londrina": 5.5,
  "maringá": 8.0,
  "joinville": 7.2,
  "balneário camboriú": 12.0,
  "natal": 4.0,
  "vitória": 5.5,
  "jundiaí": 6.8,
  "piracicaba": 5.5,
};
const NATIONAL_APPRECIATION = 5.0; // national average

// Major Brazilian capitals and large metros
const MAJOR_CITIES = new Set([
  "são paulo", "sao paulo",
  "rio de janeiro",
  "belo horizonte",
  "curitiba",
  "porto alegre",
  "brasília", "brasilia",
  "fortaleza",
  "salvador",
  "recife",
  "manaus",
  "belém", "belem",
  "goiânia", "goiania",
  "florianópolis", "florianopolis",
  "vitória", "vitoria",
  "campinas",
  "guarulhos",
  "são bernardo do campo", "sao bernardo do campo",
  "osasco",
  "campo grande",
  "natal",
  "teresina",
  "maceió", "maceio",
  "joão pessoa", "joao pessoa",
  "aracaju",
  "cuiabá", "cuiaba",
  "porto velho",
  "são luís", "sao luis",
  "macapá", "macapa",
  "boa vista",
  "palmas",
  "rio branco",
]);

// Growing interior / secondary cities
const GROWING_INTERIOR_CITIES = new Set([
  "ribeirão preto", "ribeirao preto",
  "sorocaba",
  "são josé dos campos", "sao jose dos campos",
  "uberlândia", "uberlandia",
  "londrina",
  "maringá", "maringa",
  "joinville",
  "caxias do sul",
  "juiz de fora",
  "cascavel",
  "foz do iguaçu", "foz do iguacu",
  "piracicaba",
  "santos",
  "balneário camboriú", "balneario camboriu",
  "jundiaí", "jundiai",
  "taubaté", "taubate",
  "blumenau",
  "chapecó", "chapeco",
  "pelotas",
  "santa maria",
  "anápolis", "anapolis",
  "aparecida de goiânia", "aparecida de goiania",
  "caruaru",
  "feira de santana",
  "campina grande",
  "mossoró", "mossoro",
  "vitória", "vitoria",
  "são josé do rio preto", "sao jose do rio preto",
  "são caetano do sul", "sao caetano do sul",
  "barueri",
  "betim",
  "contagem",
  "diadema",
  "guarujá", "guaruja",
  "praia grande",
  "itajaí", "itajai",
  "criciúma", "criciuma",
  "ponta grossa",
  "apucarana",
  "novo hamburgo",
  "são leopoldo", "sao leopoldo",
  "canoas",
  "gravataí", "gravataicachoeirinha",
  "cachoeirinha",
  "viamão",
  "rondonópolis", "rondonopolis",
  "sinop",
  "santarém", "santarem",
  "parauapebas",
  "marabá", "maraba",
]);

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseDetails(raw: string | Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseCharacteristics(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi)$/i.test(url) ||
    /youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com/i.test(url);
}

// Map property type to market data category
function getMarketCategory(type: string): keyof typeof NATIONAL_AVG {
  switch (type) {
    case "casa":
    case "casa_condominio":
      return "casa";
    case "terreno":
    case "terreno_condominio":
      return "terreno";
    case "apartamento":
      return "apartamento";
    case "comercial":
      return "comercial";
    default:
      return "casa";
  }
}

// Normalize city name for lookup (remove accents variant for lookup)
function normCity(city: string): string {
  return city.toLowerCase().trim();
}

// ─── Factor 1: Preço/m² vs Mercado Regional (max 25 pts) ──────────────────

function scorePriceVsMarket(property: ScoredProperty): ValuationFactor {
  const cityLower = normCity(property.city || "");

  // Get market reference for this city
  const cityData = MARKET_DATA[cityLower];
  let category = getMarketCategory(property.type);

  // Rural uses terreno * 0.3 multiplier
  const isRural = property.type === "rural";
  let marketAvg: number;
  if (isRural) {
    const ref = cityData?.terreno ?? NATIONAL_AVG.terreno;
    marketAvg = ref * 0.3;
  } else {
    marketAvg = cityData?.[category] ?? NATIONAL_AVG[category];
  }

  const cityLabel = property.city || "sua região";
  const typeLabels: Record<string, string> = {
    apartamento: "apartamento",
    casa: "casa",
    casa_condominio: "casa em condomínio",
    terreno: "terreno",
    terreno_condominio: "terreno em condomínio",
    comercial: "comercial",
    rural: "rural",
  };
  const typeLabel = typeLabels[property.type] ?? property.type;

  if (!property.price || !property.area || property.area <= 0) {
    return {
      name: "Preço vs Mercado Regional",
      score: 12,
      maxScore: 25,
      description: `Preço ou área não informados — pontuação neutra. Média FipeZap para ${typeLabel} em ${cityLabel}: R$\u00A0${marketAvg.toLocaleString("pt-BR")}/m² (Fonte: FipeZap 2024). Dica: preencha o preço e a área do imóvel para calcular o posicionamento de mercado correto.`,
    };
  }

  const actualPpm = property.price / property.area;
  const ratio = actualPpm / marketAvg;

  let score: number;
  let qualifier: string;
  let tip: string;

  if (ratio <= 0.7) {
    score = 25;
    qualifier = "excelente negócio — bem abaixo da média";
    tip = "";
  } else if (ratio <= 0.9) {
    score = 20;
    qualifier = "bom negócio — abaixo da média";
    tip = "";
  } else if (ratio <= 1.1) {
    score = 15;
    qualifier = "em linha com o mercado";
    tip = "Dica: um preço ligeiramente abaixo do mercado pode elevar este score e acelerar a venda.";
  } else if (ratio <= 1.3) {
    score = 10;
    qualifier = "acima da média de mercado";
    tip = "Dica: o preço está acima da média regional. Reveja a precificação para melhorar este score.";
  } else {
    score = 5;
    qualifier = "bem acima da média de mercado";
    tip = "Dica: o preço está significativamente acima do mercado. Considere ajustá-lo para ganhar competitividade.";
  }

  const description = `R$\u00A0${Math.round(actualPpm).toLocaleString("pt-BR")}/m² vs média de R$\u00A0${marketAvg.toLocaleString("pt-BR")}/m² em ${cityLabel} para ${typeLabel} — ${qualifier}. Fonte: FipeZap 2024.${tip ? ` ${tip}` : ""}`;

  return { name: "Preço vs Mercado Regional", score, maxScore: 25, description };
}

// ─── Factor 2: Valorização da Região — Tendência (max 20 pts) ─────────────

function scoreAppreciation(property: ScoredProperty): ValuationFactor {
  const cityLower = normCity(property.city || "");
  const rate = APPRECIATION_RATES[cityLower] ?? NATIONAL_APPRECIATION;
  const cityLabel = property.city || "média nacional";

  let score: number;
  if (rate > 10) {
    score = 20;
  } else if (rate >= 7) {
    score = 16;
  } else if (rate >= 5) {
    score = 12;
  } else if (rate >= 3) {
    score = 8;
  } else {
    score = 4;
  }

  const isNational = APPRECIATION_RATES[cityLower] == null;
  const sourceNote = isNational
    ? `Usando média nacional de ${NATIONAL_APPRECIATION}% ao ano (Fonte: FipeZap 2024). A localização do imóvel influencia diretamente este fator — cidades com alta demanda e infraestrutura valorizam mais.`
    : `${cityLabel} apresenta valorização de ${rate}% ao ano (Fonte: FipeZap 2024). Este fator reflete o crescimento histórico de preços na cidade e não pode ser alterado diretamente pelo anunciante.`;

  return {
    name: "Valorização da Região",
    score,
    maxScore: 20,
    description: sourceNote,
  };
}

// ─── Factor 3: Infraestrutura e Localização (max 20 pts) ──────────────────

function scoreLocation(property: ScoredProperty): ValuationFactor {
  const cityLower = normCity(property.city || "");
  let score = 0;
  const parts: string[] = [];

  const missingParts: string[] = [];

  if (property.latitude != null && property.longitude != null) {
    score += 3;
    parts.push("coordenadas GPS disponíveis (+3)");
  } else {
    missingParts.push("o endereço será georreferenciado automaticamente ao salvar");
  }

  if (property.condominium_id || property.condominium_name) {
    score += 7;
    parts.push(`condomínio informado: ${property.condominium_name || "vinculado"} (+7)`);
  } else if (property.type === "casa_condominio" || property.type === "terreno_condominio") {
    score += 4;
    parts.push("tipo condomínio (+4)");
    missingParts.push("informe o nome do condomínio para ganhar +3 pontos extras");
  }

  if (MAJOR_CITIES.has(cityLower)) {
    score += 5;
    parts.push("capital/grande metrópole (+5, Fonte: IBGE)");
  } else if (GROWING_INTERIOR_CITIES.has(cityLower)) {
    score += 3;
    parts.push("cidade interior em crescimento (+3, Fonte: IBGE/SECOVI)");
  }

  if (property.neighborhood) {
    score += 2;
    parts.push("bairro informado (+2)");
  } else {
    missingParts.push("informe o bairro para ganhar +2 pontos");
  }

  let description = "";
  if (parts.length > 0) {
    description = `Pontos positivos: ${parts.join(", ")}.`;
  }
  if (missingParts.length > 0) {
    description += (description ? " " : "") + `Dicas para melhorar: ${missingParts.join("; ")}.`;
  }
  if (!description) {
    description = "Localização sem diferenciais mapeados. Preencha o bairro e o endereço completo para ganhar pontos.";
  }

  return { name: "Infraestrutura e Localização", score: Math.min(score, 20), maxScore: 20, description };
}

// ─── Factor 4: Características do Imóvel (max 20 pts) ─────────────────────

function scoreCharacteristics(property: ScoredProperty): ValuationFactor {
  const details = parseDetails(property.details);
  const characteristics = parseCharacteristics(property.characteristics);
  const charLower = characteristics.map((c) => c.toLowerCase());

  let score = 0;
  const parts: string[] = [];

  // Pool
  const hasPool =
    details.pool === true ||
    details.pool === 1 ||
    charLower.some((c) => c.includes("piscina"));
  if (hasPool) {
    score += 4;
    parts.push("piscina");
  }

  // Gated community
  const isGated =
    details.gated_community === true ||
    details.gated_community === 1 ||
    charLower.some((c) => c.includes("condomínio") || c.includes("condominio") || c.includes("fechado"));
  if (isGated) {
    score += 4;
    parts.push("condomínio fechado");
  }

  // Area > 200m²
  if (property.area > 200) {
    score += 3;
    parts.push(`área grande (${property.area}m²)`);
  }

  // 3+ bedrooms
  const bedrooms = Number(details.bedrooms) || 0;
  if (bedrooms >= 3) {
    score += 3;
    parts.push(`${bedrooms} quartos`);
  }

  // 2+ bathrooms
  const bathrooms = Number(details.bathrooms) || 0;
  if (bathrooms >= 2) {
    score += 2;
    parts.push(`${bathrooms} banheiros`);
  }

  // Garage
  const garage = Number(details.garage) || 0;
  if (garage >= 1) {
    score += 2;
    parts.push(`${garage} vaga(s)`);
  }

  // Paved street
  const isPaved =
    details.paved_street === true ||
    details.paved_street === 1 ||
    charLower.some((c) => c.includes("asfalt") || c.includes("paviment"));
  if (isPaved) {
    score += 2;
    parts.push("rua asfaltada");
  }

  const missingCharParts: string[] = [];
  if (!hasPool) missingCharParts.push("piscina (+4)");
  if (!isGated) missingCharParts.push("condomínio fechado (+4)");
  if (property.area <= 200) missingCharParts.push("área acima de 200m² (+3)");
  if (bedrooms < 3) missingCharParts.push("3 ou mais quartos (+3)");
  if (bathrooms < 2) missingCharParts.push("2 ou mais banheiros (+2)");
  if (garage < 1) missingCharParts.push("garagem (+2)");
  if (!isPaved) missingCharParts.push("rua asfaltada (+2)");

  let description = "";
  if (parts.length > 0) {
    description = `Características presentes: ${parts.join(", ")}.`;
  }
  if (missingCharParts.length > 0 && Math.min(score, 20) < 20) {
    const topMissing = missingCharParts.slice(0, 3);
    description += (description ? " " : "") + `Dica: adicione nas características — ${topMissing.join(", ")} — para aumentar este score.`;
  }
  if (!description) {
    description = "Sem características diferenciais registradas. Dica: adicione piscina, garagem, número de quartos e banheiros para ganhar pontos.";
  }

  return {
    name: "Características do Imóvel",
    score: Math.min(score, 20),
    maxScore: 20,
    description,
  };
}

// ─── Factor 5: Qualidade e Visibilidade do Anúncio (max 15 pts) ───────────

function scoreListingQuality(property: ScoredProperty): ValuationFactor {
  let score = 0;
  const parts: string[] = [];
  const missingListingParts: string[] = [];

  const desc = property.description || "";
  if (desc.length > 0) {
    score += 2;
    parts.push("descrição presente (+2)");
  } else {
    missingListingParts.push("adicione uma descrição ao anúncio (+2)");
  }
  if (desc.length > 200) {
    score += 2;
    parts.push("descrição detalhada (+2)");
  } else if (desc.length > 0) {
    missingListingParts.push(`escreva pelo menos 200 caracteres na descrição para ganhar +2 pontos (atual: ${desc.length})`);
  }

  const images = property.images || [];
  if (images.length >= 5) {
    score += 4;
    parts.push(`${images.length} fotos (+4)`);
  } else if (images.length > 0) {
    score += 1;
    parts.push(`${images.length} foto(s) (+1)`);
    missingListingParts.push(`adicione mais ${5 - images.length} foto(s) para ganhar +3 pontos extras`);
  } else {
    missingListingParts.push("adicione pelo menos 5 fotos para ganhar +4 pontos");
  }

  const hasVideo = images.some((img) => isVideoUrl(img.filename || ""));
  if (hasVideo) {
    score += 3;
    parts.push("vídeo (+3)");
  } else {
    missingListingParts.push("adicione um vídeo ou tour virtual para ganhar +3 pontos");
  }

  if (property.facade_orientation) {
    score += 2;
    parts.push(`orientação da fachada: ${property.facade_orientation} (+2)`);
  } else {
    missingListingParts.push("informe a orientação solar da fachada (+2)");
  }

  if (property.condominium_id || property.condominium_name) {
    score += 2;
    parts.push(`condomínio: ${property.condominium_name || "vinculado"} (+2)`);
  }

  let description = "";
  if (parts.length > 0) {
    description = `O anúncio tem: ${parts.join(", ")}.`;
  }
  if (missingListingParts.length > 0 && Math.min(score, 15) < 15) {
    const topMissing = missingListingParts.slice(0, 2);
    description += (description ? " " : "") + `Dica: ${topMissing.join("; ")}.`;
  }
  if (!description) {
    description = "Anúncio com poucas informações. Adicione descrição, fotos e vídeo para melhorar este score.";
  }

  return {
    name: "Qualidade do Anúncio",
    score: Math.min(score, 15),
    maxScore: 15,
    description,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────

export function calculateValuationScore(property: ScoredProperty): ValuationResult {
  const factors: ValuationFactor[] = [
    scorePriceVsMarket(property),
    scoreAppreciation(property),
    scoreLocation(property),
    scoreCharacteristics(property),
    scoreListingQuality(property),
  ];

  const total = factors.reduce((sum, f) => sum + f.score, 0);
  const score = Math.min(100, Math.max(0, Math.round(total)));

  let classification: ValuationResult["classification"];
  let color: string;

  if (score >= 80) {
    classification = "Excepcional";
    color = "emerald";
  } else if (score >= 60) {
    classification = "Alto";
    color = "teal";
  } else if (score >= 40) {
    classification = "Bom";
    color = "yellow";
  } else if (score >= 20) {
    classification = "Moderado";
    color = "orange";
  } else {
    classification = "Baixo";
    color = "red";
  }

  return {
    score,
    classification,
    color,
    factors,
    dataSource: "Baseado em dados FipeZap 2024, SECOVI e IBGE",
  };
}
