// Valuation score utility — estimates appreciation potential for a property.
// Score is 0-100, computed from 6 factors.

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
  images?: { filename?: string }[] | null;
  facade_orientation?: string | null;
}

// Major Brazilian cities with strong real-estate markets
const MAJOR_CITIES = new Set([
  "são paulo",
  "sao paulo",
  "rio de janeiro",
  "belo horizonte",
  "curitiba",
  "porto alegre",
  "brasília",
  "brasilia",
  "fortaleza",
  "salvador",
  "recife",
  "manaus",
  "belém",
  "belem",
  "goiânia",
  "goiania",
  "florianópolis",
  "florianopolis",
  "vitória",
  "vitoria",
  "campinas",
  "guarulhos",
  "são bernardo do campo",
  "sao bernardo do campo",
  "osasco",
  "santo andré",
  "santo andre",
  "mogi das cruzes",
  "duque de caxias",
  "nova iguaçu",
  "nova iguacu",
  "são gonçalo",
  "sao goncalo",
  "niterói",
  "niteroi",
  "porto velho",
  "campo grande",
  "natal",
  "teresina",
  "maceió",
  "maceio",
  "joão pessoa",
  "joao pessoa",
  "aracaju",
  "macapá",
  "macapa",
  "boa vista",
  "palmas",
  "são luís",
  "sao luis",
  "cuiabá",
  "cuiaba",
  "rio branco",
]);

// Growing interior / secondary cities
const GROWING_INTERIOR_CITIES = new Set([
  "ribeirão preto",
  "ribeirao preto",
  "sorocaba",
  "são josé dos campos",
  "sao jose dos campos",
  "uberlândia",
  "uberlandia",
  "londrina",
  "maringá",
  "maringa",
  "joinville",
  "caxias do sul",
  "juiz de fora",
  "cascavel",
  "foz do iguaçu",
  "foz do iguacu",
  "piracicaba",
  "santos",
  "são vicente",
  "sao vicente",
  "bauru",
  "limeira",
  "jundiaí",
  "jundiai",
  "taubaté",
  "taubate",
  "blumenau",
  "chapecó",
  "chapeco",
  "pelotas",
  "santa maria",
  "anápolis",
  "anapolis",
  "aparecida de goiânia",
  "aparecida de goiania",
  "caruaru",
  "feira de santana",
  "ilhéus",
  "ilheus",
  "itabuna",
  "petrolina",
  "mossoró",
  "mossoro",
  "campina grande",
  "imperatriz",
  "parauapebas",
  "marabá",
  "maraba",
  "santarém",
  "santarem",
  "sinop",
  "rondonópolis",
  "rondonopolis",
  "são josé do rio preto",
  "sao jose do rio preto",
  "americana",
  "araraquara",
  "barueri",
  "betim",
  "contagem",
  "diadema",
  "itapevi",
  "itaquaquecetuba",
  "são caetano do sul",
  "sao caetano do sul",
  "suzano",
  "mauá",
  "maua",
  "carapicuíba",
  "carapicuiba",
  "guarujá",
  "guaruja",
  "praia grande",
  "são josé",
  "sao jose",
  "balneário camboriú",
  "balneario camboriu",
  "itajaí",
  "itajai",
  "criciúma",
  "criciuma",
  "ponta grossa",
  "apucarana",
  "santa cruz do sul",
  "novo hamburgo",
  "são leopoldo",
  "sao leopoldo",
  "canoas",
  "gravataí",
  "gravataí",
  "gravataicachoeirinha",
  "cachoeirinha",
  "viamão",
  "viaamo",
]);

// Typical R$/m² reference by type (rough averages across Brazil; used only for relative comparison)
const PRICE_PER_SQM_AVERAGE: Record<string, number> = {
  terreno: 400,
  terreno_condominio: 800,
  casa: 3500,
  casa_condominio: 5000,
  apartamento: 7000,
  comercial: 5000,
  rural: 150,
};

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

// ─── Factor calculators ────────────────────────────────────────────────────

function scorePropertyType(type: string): ValuationFactor {
  const scores: Record<string, number> = {
    casa_condominio: 15,
    terreno_condominio: 14,
    apartamento: 12,
    casa: 10,
    terreno: 8,
    comercial: 7,
    rural: 5,
  };
  const typeLabels: Record<string, string> = {
    casa_condominio: "Casa em condomínio",
    terreno_condominio: "Terreno em condomínio",
    apartamento: "Apartamento",
    casa: "Casa",
    terreno: "Terreno",
    comercial: "Comercial",
    rural: "Rural",
  };
  const score = scores[type] ?? 5;
  return {
    name: "Tipo do Imóvel",
    score,
    maxScore: 15,
    description: `${typeLabels[type] || type} tem ${score >= 12 ? "alto" : score >= 8 ? "médio" : "baixo"} potencial de valorização histórico.`,
  };
}

function scoreCondominium(property: ScoredProperty): ValuationFactor {
  let score = 0;
  let description = "Imóvel não pertence a um condomínio.";

  if (property.condominium_id) {
    score = 15;
    description = "Pertence a um condomínio cadastrado — tende a valorizar mais.";
  } else if (
    property.type === "casa_condominio" ||
    property.type === "terreno_condominio"
  ) {
    score = 10;
    description = "Tipo de condomínio sem vínculo cadastrado.";
  } else {
    score = 0;
  }

  return { name: "Condomínio", score, maxScore: 15, description };
}

function scoreLocation(property: ScoredProperty): ValuationFactor {
  const cityLower = (property.city || "").toLowerCase().trim();
  let score = 0;
  const parts: string[] = [];

  if (property.latitude != null && property.longitude != null) {
    score += 5;
    parts.push("coordenadas GPS disponíveis");
  }

  if (MAJOR_CITIES.has(cityLower)) {
    score += 10;
    parts.push("grande centro urbano");
  } else if (GROWING_INTERIOR_CITIES.has(cityLower)) {
    score += 8;
    parts.push("cidade em crescimento");
  }

  if (property.neighborhood) {
    score += 5;
    parts.push("bairro especificado");
  }

  const description =
    parts.length > 0
      ? `Localização: ${parts.join(", ")}.`
      : "Localização sem diferenciais mapeados.";

  return { name: "Localização", score, maxScore: 20, description };
}

function scoreCharacteristics(property: ScoredProperty): ValuationFactor {
  const details = parseDetails(property.details);
  const characteristics = parseCharacteristics(property.characteristics);
  const charLower = characteristics.map((c) => c.toLowerCase());

  let score = 0;
  const parts: string[] = [];

  // Check pool
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

  // Paved street
  const isPaved =
    details.paved_street === true ||
    details.paved_street === 1 ||
    charLower.some((c) => c.includes("asfalt") || c.includes("paviment"));
  if (isPaved) {
    score += 3;
    parts.push("rua asfaltada");
  }

  // Area
  if (property.area > 200) {
    score += 3;
    parts.push(`área grande (${property.area}m²)`);
  }

  // Bedrooms
  const bedrooms = Number(details.bedrooms) || 0;
  if (bedrooms >= 3) {
    score += 3;
    parts.push(`${bedrooms} quartos`);
  }

  // Bathrooms
  const bathrooms = Number(details.bathrooms) || 0;
  if (bathrooms >= 2) {
    score += 2;
    parts.push(`${bathrooms} banheiros`);
  }

  // Garage
  const garage = Number(details.garage) || 0;
  if (garage >= 1) {
    score += 1;
    parts.push(`${garage} vaga(s)`);
  }

  const description =
    parts.length > 0
      ? `Características presentes: ${parts.join(", ")}.`
      : "Sem características diferenciais registradas.";

  return {
    name: "Características",
    score: Math.min(score, 20),
    maxScore: 20,
    description,
  };
}

function scoreListingQuality(property: ScoredProperty): ValuationFactor {
  let score = 0;
  const parts: string[] = [];

  const desc = property.description || "";
  if (desc.length > 0) {
    score += 3;
    parts.push("descrição presente");
  }
  if (desc.length > 200) {
    score += 2;
    parts.push("descrição detalhada");
  }

  const images = property.images || [];
  if (images.length >= 5) {
    score += 4;
    parts.push(`${images.length} fotos`);
  } else if (images.length > 0) {
    score += 1;
    parts.push(`${images.length} foto(s)`);
  }

  const hasVideo = images.some((img) =>
    isVideoUrl(img.filename || "")
  );
  if (hasVideo) {
    score += 3;
    parts.push("vídeo");
  }

  if (property.facade_orientation) {
    score += 3;
    parts.push(`orientação da fachada (${property.facade_orientation})`);
  }

  const description =
    parts.length > 0
      ? `Qualidade do anúncio: ${parts.join(", ")}.`
      : "Anúncio com poucas informações.";

  return {
    name: "Qualidade do Anúncio",
    score: Math.min(score, 15),
    maxScore: 15,
    description,
  };
}

function scorePriceCompetitiveness(property: ScoredProperty): ValuationFactor {
  const avgPricePerSqm = PRICE_PER_SQM_AVERAGE[property.type] ?? 3000;

  if (!property.price || !property.area || property.area <= 0) {
    return {
      name: "Competitividade de Preço",
      score: 7,
      maxScore: 15,
      description: "Preço ou área não informados — pontuação neutra.",
    };
  }

  const actualPricePerSqm = property.price / property.area;
  const ratio = actualPricePerSqm / avgPricePerSqm;

  let score: number;
  let description: string;

  if (ratio <= 0.85) {
    score = 15;
    description = `Preço/m² abaixo da média para ${property.type} (R$${Math.round(actualPricePerSqm).toLocaleString("pt-BR")}/m²) — excelente custo-benefício.`;
  } else if (ratio <= 1.15) {
    score = 10;
    description = `Preço/m² próximo à média para ${property.type} (R$${Math.round(actualPricePerSqm).toLocaleString("pt-BR")}/m²).`;
  } else {
    score = 5;
    description = `Preço/m² acima da média para ${property.type} (R$${Math.round(actualPricePerSqm).toLocaleString("pt-BR")}/m²).`;
  }

  return { name: "Competitividade de Preço", score, maxScore: 15, description };
}

// ─── Main entry point ─────────────────────────────────────────────────────

export function calculateValuationScore(property: ScoredProperty): ValuationResult {
  const factors: ValuationFactor[] = [
    scorePropertyType(property.type),
    scoreCondominium(property),
    scoreLocation(property),
    scoreCharacteristics(property),
    scoreListingQuality(property),
    scorePriceCompetitiveness(property),
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

  return { score, classification, color, factors };
}
