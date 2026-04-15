import { NextRequest, NextResponse } from "next/server";
import { getOne, query } from "@/lib/db";

// Haversine formula to calculate distance in meters between two lat/lng points
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type PoiCategory =
  | "education"
  | "health"
  | "shopping"
  | "leisure"
  | "transport"
  | "food";

interface POI {
  category: PoiCategory;
  name: string;
  lat: number;
  lng: number;
  distance_meters: number;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Build an Overpass QL query for all categories within radius_m meters of a point
function buildOverpassQuery(lat: number, lng: number, radius_m: number): string {
  // Each union block fetches a specific amenity/shop/leisure/highway/railway tag
  const blocks = [
    // Education
    `node["amenity"~"^(school|university|kindergarten)$"](around:${radius_m},${lat},${lng});`,
    `way["amenity"~"^(school|university|kindergarten)$"](around:${radius_m},${lat},${lng});`,
    // Health
    `node["amenity"~"^(hospital|clinic|pharmacy)$"](around:${radius_m},${lat},${lng});`,
    `way["amenity"~"^(hospital|clinic|pharmacy)$"](around:${radius_m},${lat},${lng});`,
    // Shopping
    `node["shop"~"^(supermarket|mall)$"](around:${radius_m},${lat},${lng});`,
    `way["shop"~"^(supermarket|mall)$"](around:${radius_m},${lat},${lng});`,
    // Leisure
    `node["leisure"~"^(park|sports_centre|swimming_pool)$"](around:${radius_m},${lat},${lng});`,
    `way["leisure"~"^(park|sports_centre|swimming_pool)$"](around:${radius_m},${lat},${lng});`,
    // Transport
    `node["highway"="bus_stop"](around:${radius_m},${lat},${lng});`,
    `node["railway"="station"](around:${radius_m},${lat},${lng});`,
    `node["public_transport"="stop_position"](around:${radius_m},${lat},${lng});`,
    // Food
    `node["amenity"~"^(restaurant|cafe)$"](around:${radius_m},${lat},${lng});`,
    `way["amenity"~"^(restaurant|cafe)$"](around:${radius_m},${lat},${lng});`,
  ];
  return `[out:json][timeout:25];\n(\n  ${blocks.join("\n  ")}\n);\nout center;`;
}

// Map OSM tags to our category
function tagToCategory(tags: Record<string, string>): PoiCategory | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const leisure = tags.leisure;
  const highway = tags.highway;
  const railway = tags.railway;
  const publicTransport = tags.public_transport;

  if (amenity && ["school", "university", "kindergarten"].includes(amenity))
    return "education";
  if (amenity && ["hospital", "clinic", "pharmacy"].includes(amenity))
    return "health";
  if (shop && ["supermarket", "mall"].includes(shop)) return "shopping";
  if (leisure && ["park", "sports_centre", "swimming_pool"].includes(leisure))
    return "leisure";
  if (
    highway === "bus_stop" ||
    railway === "station" ||
    publicTransport === "stop_position"
  )
    return "transport";
  if (amenity && ["restaurant", "cafe"].includes(amenity)) return "food";
  return null;
}

async function fetchPoisFromOverpass(
  lat: number,
  lng: number
): Promise<POI[]> {
  const RADIUS_M = 2000;
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  const overpassQuery = buildOverpassQuery(lat, lng, RADIUS_M);

  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const json = (await response.json()) as { elements: OverpassElement[] };
  const elements: OverpassElement[] = json.elements || [];

  // Collect POIs per category, limiting to 5 each
  const byCategory: Record<PoiCategory, POI[]> = {
    education: [],
    health: [],
    shopping: [],
    leisure: [],
    transport: [],
    food: [],
  };

  for (const el of elements) {
    const tags = el.tags || {};
    const category = tagToCategory(tags);
    if (!category) continue;

    // Resolve coordinate (node has lat/lon directly, way has center)
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const name =
      tags.name ||
      tags["name:pt"] ||
      (category === "transport"
        ? tags.ref || "Parada"
        : category === "education"
        ? "Escola"
        : category === "health"
        ? "Farmácia"
        : category === "shopping"
        ? "Mercado"
        : category === "leisure"
        ? "Parque"
        : "Restaurante");

    const distance_meters = Math.round(haversineDistance(lat, lng, elLat, elLng));

    byCategory[category].push({
      category,
      name,
      lat: elLat,
      lng: elLng,
      distance_meters,
    });
  }

  // Sort each category by distance and limit to 5
  const result: POI[] = [];
  for (const cat of Object.keys(byCategory) as PoiCategory[]) {
    const sorted = byCategory[cat]
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 5);
    result.push(...sorted);
  }

  return result;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const propertyId = parseInt(id, 10);
  if (isNaN(propertyId)) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  // Load property coords
  const property = await getOne(
    "SELECT latitude, longitude FROM properties WHERE id = $1",
    [propertyId]
  );
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  if (!property.latitude || !property.longitude) {
    return NextResponse.json({ pois: [] });
  }

  // Check cache (7-day TTL)
  const cached = await getOne(
    "SELECT data, fetched_at FROM property_pois_cache WHERE property_id = $1",
    [propertyId]
  );
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (ageMs < sevenDaysMs) {
      return NextResponse.json({ pois: cached.data, cached: true });
    }
  }

  // Fetch fresh data from Overpass
  try {
    const pois = await fetchPoisFromOverpass(
      property.latitude,
      property.longitude
    );

    // Upsert into cache
    await query(
      `INSERT INTO property_pois_cache (property_id, data, fetched_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (property_id) DO UPDATE
         SET data = EXCLUDED.data, fetched_at = EXCLUDED.fetched_at`,
      [propertyId, JSON.stringify(pois)]
    );

    return NextResponse.json({ pois, cached: false });
  } catch (err) {
    console.error("POI fetch error:", err);
    // Return cached data if available even if stale, rather than failing
    if (cached) {
      return NextResponse.json({ pois: cached.data, cached: true, stale: true });
    }
    return NextResponse.json({ pois: [] });
  }
}
