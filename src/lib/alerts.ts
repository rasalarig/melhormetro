import { getAll, query } from "./db";
import { localSearch } from "./search";

interface AlertRow {
  id: number;
  user_id: number;
  prompt: string;
  is_active: number;
  created_at: string;
  profile_name?: string | null;
  property_type?: string | null;
  max_price?: number | null;
  min_area?: number | null;
  city?: string | null;
  state?: string | null;
  min_bedrooms?: number | null;
  must_have_characteristics?: string[] | null;
}

interface PropertyRow {
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
  cover_image: string | null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Score a property against a structured alert profile.
 * Returns the structured score (0 if no fields set) and reasons.
 */
function scorePropertyAgainstProfile(
  alert: AlertRow,
  property: PropertyRow
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const details: Record<string, unknown> = (() => {
    try {
      return JSON.parse(property.details || "{}");
    } catch {
      return {};
    }
  })();

  const chars: string[] = (() => {
    try {
      return (JSON.parse(property.characteristics || "[]") as string[]).map(
        (c) => c.toLowerCase()
      );
    } catch {
      return [];
    }
  })();

  // property_type match → +20
  if (alert.property_type) {
    const alertType = normalize(alert.property_type);
    const propType = normalize(property.type);
    if (propType.includes(alertType) || alertType.includes(propType)) {
      score += 20;
      reasons.push(`Tipo: ${property.type}`);
    }
  }

  // max_price → +15 if property price is within budget
  if (alert.max_price != null) {
    if (property.price <= alert.max_price) {
      score += 15;
      reasons.push(`Dentro do orçamento (R$ ${property.price.toLocaleString("pt-BR")})`);
    }
  }

  // min_area → +10 if property area meets minimum
  if (alert.min_area != null) {
    if (property.area >= alert.min_area) {
      score += 10;
      reasons.push(`Área suficiente (${property.area}m²)`);
    }
  }

  // city match → +15
  if (alert.city) {
    const alertCity = normalize(alert.city);
    const propCity = normalize(property.city);
    const propNeigh = normalize(property.neighborhood || "");
    if (
      propCity.includes(alertCity) ||
      alertCity.includes(propCity) ||
      propNeigh.includes(alertCity)
    ) {
      score += 15;
      reasons.push(`Cidade: ${property.city}`);
    }
  }

  // state match (only if city not matched, as minor bonus)
  if (alert.state && !alert.city) {
    const alertState = normalize(alert.state);
    const propState = normalize(property.state);
    if (propState === alertState) {
      score += 5;
      reasons.push(`Estado: ${property.state}`);
    }
  }

  // min_bedrooms → +10
  if (alert.min_bedrooms != null) {
    const propBedrooms = (details.bedrooms as number) || 0;
    if (propBedrooms >= alert.min_bedrooms) {
      score += 10;
      reasons.push(`${propBedrooms} quartos`);
    }
  }

  // must_have_characteristics → +5 per match
  if (
    alert.must_have_characteristics &&
    alert.must_have_characteristics.length > 0
  ) {
    const searchText = normalize(
      [property.title, property.description, ...chars].join(" ")
    );
    for (const char of alert.must_have_characteristics) {
      const charNorm = normalize(char);
      if (
        chars.some((c) => normalize(c).includes(charNorm)) ||
        searchText.includes(charNorm)
      ) {
        score += 5;
        reasons.push(`Possui: ${char}`);
      }
    }
  }

  return { score, reasons };
}

/**
 * Check all active alerts against a newly created property.
 * Uses both structured profile scoring and AI-based text matching.
 * Total score > 30 → create a match.
 */
export async function checkAlertsForProperty(propertyId: number) {
  const alerts = (await getAll(
    "SELECT * FROM search_alerts WHERE is_active = 1"
  )) as AlertRow[];

  for (const alert of alerts) {
    try {
      let totalScore = 0;
      const allReasons: string[] = [];

      // Structured profile scoring
      const properties = (await getAll(
        `SELECT p.*, p.characteristics, p.details FROM properties p WHERE p.id = $1`,
        [propertyId]
      )) as PropertyRow[];

      if (properties.length > 0) {
        const property = properties[0];
        const structured = scorePropertyAgainstProfile(alert, property);
        totalScore += structured.score;
        allReasons.push(...structured.reasons);
      }

      // AI/text-based scoring from existing prompt
      if (alert.prompt && alert.prompt.trim()) {
        const results = await localSearch(alert.prompt);
        const match = results.find((r) => r.property.id === propertyId);
        if (match) {
          totalScore += match.score;
          allReasons.push(...match.matchReasons);
        }
      }

      if (totalScore > 30) {
        const uniqueReasons = Array.from(new Set(allReasons));
        await query(
          `INSERT INTO alert_matches (alert_id, property_id, score, reasons)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [alert.id, propertyId, totalScore, JSON.stringify(uniqueReasons)]
        );
      }
    } catch (error) {
      console.error(
        `Error checking alert ${alert.id} for property ${propertyId}:`,
        error
      );
    }
  }
}

/**
 * Run an alert's criteria against all existing active properties.
 * Returns the number of matches created.
 */
export async function runAlertAgainstAllProperties(
  alertId: number,
  prompt: string
): Promise<number> {
  const results = await localSearch(prompt);

  let count = 0;
  for (const result of results) {
    if (result.score > 5) {
      const res = await query(
        `INSERT INTO alert_matches (alert_id, property_id, score, reasons)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [
          alertId,
          result.property.id,
          result.score,
          JSON.stringify(result.matchReasons),
        ]
      );
      if (res.rowCount && res.rowCount > 0) count++;
    }
  }

  return count;
}

/**
 * Run a full structured + text alert against all existing properties.
 * Used when creating a new profile-based alert.
 */
export async function runProfileAlertAgainstAllProperties(
  alertId: number,
  alert: AlertRow
): Promise<number> {
  const properties = (await getAll(
    `SELECT p.*,
      COALESCE(
        (SELECT tm.media_url FROM tour_media tm
         JOIN property_tours pt ON tm.tour_id = pt.id
         WHERE pt.property_id = p.id AND pt.is_original = TRUE AND pt.status = 'active'
           AND tm.media_type = 'image'
         ORDER BY tm.display_order ASC LIMIT 1),
        (SELECT pi.filename FROM property_images pi
         WHERE pi.property_id = p.id
         ORDER BY pi.is_cover DESC, pi.id ASC LIMIT 1)
      ) AS cover_image
    FROM properties p
    WHERE p.status = 'active' AND (p.approved = 'approved' OR p.approved IS NULL)`
  )) as PropertyRow[];

  let count = 0;

  // Text-based results if prompt exists
  const textResults: Record<number, { score: number; reasons: string[] }> = {};
  if (alert.prompt && alert.prompt.trim()) {
    const results = await localSearch(alert.prompt, properties);
    for (const r of results) {
      textResults[r.property.id] = {
        score: r.score,
        reasons: r.matchReasons,
      };
    }
  }

  for (const property of properties) {
    const structured = scorePropertyAgainstProfile(alert, property);
    const textMatch = textResults[property.id] || { score: 0, reasons: [] };

    const totalScore = structured.score + textMatch.score;
    const allReasons = Array.from(
      new Set([...structured.reasons, ...textMatch.reasons])
    );

    if (totalScore > 30) {
      const res = await query(
        `INSERT INTO alert_matches (alert_id, property_id, score, reasons)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [alertId, property.id, totalScore, JSON.stringify(allReasons)]
      );
      if (res.rowCount && res.rowCount > 0) count++;
    }
  }

  return count;
}
