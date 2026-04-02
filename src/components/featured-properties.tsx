import { PropertyCard } from "./property-card";

interface Property {
  id: number;
  title: string;
  price: number;
  area: number;
  city: string;
  state: string;
  type: string;
  characteristics: string;
}

async function getProperties() {
  const { default: db } = await import("@/lib/db");
  const properties = db.prepare("SELECT * FROM properties WHERE status = 'active' ORDER BY created_at DESC LIMIT 6").all() as Property[];

  const propertiesWithImages = properties.map(p => {
    const coverImage = db.prepare(
      "SELECT filename FROM property_images WHERE property_id = ? ORDER BY is_cover DESC LIMIT 1"
    ).get(p.id) as { filename: string } | undefined;
    return { ...p, coverImage: coverImage?.filename };
  });

  return propertiesWithImages;
}

export async function FeaturedProperties() {
  const properties = await getProperties();

  if (properties.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Imóveis em Destaque</h2>
          <p className="text-muted-foreground">Os melhores terrenos e imóveis do interior de São Paulo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              price={property.price}
              area={property.area}
              city={property.city}
              state={property.state}
              type={property.type}
              characteristics={JSON.parse(property.characteristics || "[]")}
              image={property.coverImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
