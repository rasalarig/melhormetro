import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";
import { getOne, getAll } from "@/lib/db";
import type { MediaItem } from "@/components/property-media-gallery";

export const dynamic = "force-dynamic";

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
  status: string;
  characteristics: string;
  details: string;
  created_at: string;
  updated_at: string;
  latitude: number | null;
  longitude: number | null;
  address_privacy?: "exact" | "approximate";
  approximate_radius_km?: number | null;
  allow_resale?: boolean;
  resale_commission_percent?: number | null;
  resale_terms?: string | null;
  seller_user_id?: number | null;
  condominium_id?: number | null;
  condominium_name?: string | null;
  condominium_slug?: string | null;
  listing_as?: string | null;
  is_exclusive?: boolean | null;
  exclusivity_months?: number | null;
  lister_creci?: string | null;
  lister_trade_name?: string | null;
}

interface PropertyImage {
  id: number;
  property_id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

interface TourMediaRow {
  media_url: string;
  media_type: string;
  display_order: number;
}

async function getProperty(id: string) {
  const property = await getOne(
    `SELECT p.*, s.user_id as seller_user_id,
            COALESCE(p.condominium_name, c.name) as condominium_name,
            c.slug as condominium_slug,
            up.creci as lister_creci, up.trade_name as lister_trade_name
     FROM properties p
     LEFT JOIN sellers s ON p.seller_id = s.id
     LEFT JOIN condominiums c ON p.condominium_id = c.id
     LEFT JOIN user_profiles up ON up.user_id = s.user_id
       AND up.profile_type = p.listing_as
       AND up.is_active = TRUE
     WHERE p.id = $1`,
    [Number(id)]
  ) as Property | null;
  if (!property) return null;

  const images = await getAll(
    "SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC",
    [Number(id)]
  ) as PropertyImage[];

  // Fetch tour media from the property's original (is_original = true) approved tour.
  // Falls back gracefully when no tour exists.
  const tourMediaRows = await getAll(
    `SELECT tm.media_url, tm.media_type, tm.display_order
     FROM tour_media tm
     JOIN property_tours pt ON tm.tour_id = pt.id
     WHERE pt.property_id = $1
       AND pt.is_original = true
       AND pt.status = 'active'
       AND pt.moderation_status = 'approved'
     ORDER BY tm.display_order ASC`,
    [Number(id)]
  ) as TourMediaRow[];

  // Build the combined media list: tour_media items first (if any), then fallback to property_images.
  // If tour_media exists we use it as the authoritative list; otherwise use legacy property_images.
  const tourMediaItems: MediaItem[] = tourMediaRows.map((r) => ({
    url: r.media_url,
    type: r.media_type as MediaItem["type"],
  }));

  const imageMediaItems: MediaItem[] = images.map((img) => ({
    url: img.filename,
    type: "image" as const,
    alt: img.original_name,
  }));

  // Prefer tour media when available; fall back to images.
  const mediaItems: MediaItem[] = tourMediaItems.length > 0 ? tourMediaItems : imageMediaItems;

  return { ...property, images, mediaItems };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);
  if (!property) return { title: "Imóvel não encontrado" };

  return {
    title: `${property.title} | MelhorMetro`,
    description: property.description.substring(0, 160),
  };
}

export default async function PropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return <PropertyDetail property={JSON.parse(JSON.stringify(property))} />; // mediaItems included inside property
}
