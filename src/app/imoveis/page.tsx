import { PropertyListClient } from "@/components/property-list-client";
import { getAll, getOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Imóveis Disponíveis | MelhorMetro",
  description: "Veja todos os imóveis disponíveis para compra",
};

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
  neighborhood: string;
  characteristics: string;
  created_at: string;
}

async function getProperties() {
  const properties = await getAll(
    "SELECT * FROM properties WHERE status = 'active' AND (approved = 'approved' OR approved IS NULL) ORDER BY created_at DESC"
  ) as Property[];

  const propertiesWithImages = [];
  for (const p of properties) {
    const coverImage = await getOne(
      "SELECT filename FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC LIMIT 1",
      [p.id]
    ) as { filename: string } | null;
    propertiesWithImages.push({ ...p, coverImage: coverImage?.filename });
  }

  return propertiesWithImages;
}

export default async function ImoveisPage() {
  const properties = await getProperties();

  return (
    <div className="pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <PropertyListClient properties={JSON.parse(JSON.stringify(properties))} />
      </div>
    </div>
  );
}
