import { PropertyListClient } from "@/components/property-list-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Imoveis Disponiveis | PropView",
  description: "Veja todos os imoveis disponiveis para compra",
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
  const { default: db } = await import("@/lib/db");
  const properties = db
    .prepare("SELECT * FROM properties WHERE status = 'active' ORDER BY created_at DESC")
    .all() as Property[];

  const propertiesWithImages = properties.map(p => {
    const coverImage = db.prepare(
      "SELECT filename FROM property_images WHERE property_id = ? ORDER BY is_cover DESC LIMIT 1"
    ).get(p.id) as { filename: string } | undefined;
    return { ...p, coverImage: coverImage?.filename };
  });

  return propertiesWithImages;
}

export default async function ImoveisPage() {
  const properties = await getProperties();

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <PropertyListClient properties={JSON.parse(JSON.stringify(properties))} />
      </div>
    </div>
  );
}
