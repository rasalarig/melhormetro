import db from './db';

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

export function seed() {
  const count = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };

  if (count.count > 0) {
    return { message: 'Database already seeded', count: count.count };
  }

  const insert = db.prepare(`
    INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, latitude, longitude)
    VALUES (@title, @description, @price, @area, @type, @address, @city, @state, @neighborhood, @characteristics, @details, @latitude, @longitude)
  `);

  const insertMany = db.transaction((properties: typeof sampleProperties) => {
    for (const property of properties) {
      insert.run(property);
    }
  });

  insertMany(sampleProperties);

  return { message: 'Database seeded successfully', count: sampleProperties.length };
}
