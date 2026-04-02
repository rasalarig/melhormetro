import { query, getOne } from './db';

const sampleImages: Record<number, { url: string; original_name: string; is_cover: boolean }[]> = {
  0: [
    { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=1200&fit=crop', original_name: 'condominio-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=1200&fit=crop', original_name: 'condominio-2.jpg', is_cover: false },
    { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1200&fit=crop', original_name: 'condominio-3.jpg', is_cover: false },
  ],
  1: [
    { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1200&fit=crop', original_name: 'vista-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=1200&fit=crop', original_name: 'vista-2.jpg', is_cover: false },
    { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=1200&fit=crop', original_name: 'vista-3.jpg', is_cover: false },
  ],
};

const sampleProperties = [
  {
    title: 'Terreno 300m\u00b2 em Condom\u00ednio Fechado - Itapetininga',
    description:
      'Excelente terreno de 300m\u00b2 em condom\u00ednio fechado com seguran\u00e7a 24h. Terreno plano, pronto para construir. Localizado em \u00e1rea nobre com infraestrutura completa: \u00e1gua, luz, esgoto e asfalto. Condom\u00ednio com \u00e1rea de lazer, piscina e churrasqueira. Pr\u00f3ximo a escolas e com\u00e9rcio. Vegeta\u00e7\u00e3o preservada ao redor do condom\u00ednio, com \u00e1rvores nativas. Vista para \u00e1rea verde.',
    price: 180000,
    area: 300,
    type: 'terreno',
    address: 'Rua das Palmeiras, Lote 15',
    city: 'Itapetininga',
    state: 'SP',
    neighborhood: 'Condom\u00ednio Residencial Jardim Europa',
    characteristics: JSON.stringify([
      'plano',
      'condominio fechado',
      'seguranca 24h',
      'infraestrutura completa',
      'arvores',
      'area verde',
      'piscina',
      'churrasqueira',
      'proximo escola',
      'proximo comercio',
      'asfalto',
      'agua',
      'luz',
      'esgoto',
    ]),
    latitude: -23.5920,
    longitude: -48.0530,
    details: JSON.stringify({
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      pool: false,
      gated_community: true,
      paved_street: true,
    }),
  },
  {
    title: 'Terreno 450m\u00b2 com Vista Panor\u00e2mica - Piedade',
    description:
      'Terreno amplo de 450m\u00b2 com vista panor\u00e2mica para a serra. Leve aclive com possibilidade de projeto com vista privilegiada. Terreno com algumas \u00e1rvores frut\u00edferas (mangueira e jabuticabeira). Bairro tranquilo e residencial, ideal para quem busca qualidade de vida no interior. Rua sem sa\u00edda, muito seguro para crian\u00e7as. Documenta\u00e7\u00e3o em dia, pronto para transfer\u00eancia.',
    price: 120000,
    area: 450,
    type: 'terreno',
    address: 'Rua Ant\u00f4nio Carlos, 230',
    city: 'Piedade',
    state: 'SP',
    neighborhood: 'Jardim S\u00e3o Francisco',
    characteristics: JSON.stringify([
      'vista panoramica',
      'serra',
      'aclive',
      'arvores frutiferas',
      'mangueira',
      'jabuticabeira',
      'tranquilo',
      'residencial',
      'rua sem saida',
      'seguro',
      'documentacao ok',
      'interior',
    ]),
    latitude: -23.7130,
    longitude: -47.4270,
    details: JSON.stringify({
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      pool: false,
      gated_community: false,
      paved_street: true,
    }),
  },
];

export async function seed(force = false) {
  const countRow = await getOne('SELECT COUNT(*) as count FROM properties') as { count: string };
  const count = parseInt(countRow.count, 10);

  if (count > 0 && !force) {
    return { message: 'Database already seeded', count };
  }

  // Clear existing data when force re-seeding
  if (force && count > 0) {
    await query('DELETE FROM campaign_recipients');
    await query('DELETE FROM campaigns');
    await query('DELETE FROM alert_matches');
    await query('DELETE FROM search_alerts');
    await query('DELETE FROM engagement_events');
    await query('DELETE FROM favorites');
    await query('DELETE FROM leads');
    await query('DELETE FROM property_images');
    await query('DELETE FROM properties');
  }

  for (let i = 0; i < sampleProperties.length; i++) {
    const property = sampleProperties[i];
    const result = await query(
      `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        property.title,
        property.description,
        property.price,
        property.area,
        property.type,
        property.address,
        property.city,
        property.state,
        property.neighborhood,
        property.characteristics,
        property.details,
        property.latitude,
        property.longitude,
      ]
    );

    const propertyId = result.rows[0].id;
    const images = sampleImages[i] || [];
    for (const img of images) {
      await query(
        `INSERT INTO property_images (property_id, filename, original_name, is_cover)
         VALUES ($1, $2, $3, $4)`,
        [propertyId, img.url, img.original_name, img.is_cover ? 1 : 0]
      );
    }
  }

  return { message: 'Database seeded successfully', count: sampleProperties.length };
}
