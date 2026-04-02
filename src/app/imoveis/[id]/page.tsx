import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";

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
}

interface PropertyImage {
  id: number;
  property_id: number;
  filename: string;
  original_name: string;
  is_cover: number;
}

async function getProperty(id: string) {
  const { default: db } = await import("@/lib/db");
  const property = db
    .prepare("SELECT * FROM properties WHERE id = ?")
    .get(Number(id)) as Property | undefined;
  if (!property) return null;

  const images = db
    .prepare(
      "SELECT * FROM property_images WHERE property_id = ? ORDER BY is_cover DESC"
    )
    .all(Number(id)) as PropertyImage[];

  return { ...property, images };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);
  if (!property) return { title: "Imovel nao encontrado" };

  return {
    title: `${property.title} | PropView`,
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

  return <PropertyDetail property={JSON.parse(JSON.stringify(property))} />;
}
