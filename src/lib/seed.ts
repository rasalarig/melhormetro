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
  2: [
    { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1200&fit=crop', original_name: 'casa-sorocaba-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=1200&fit=crop', original_name: 'casa-sorocaba-2.jpg', is_cover: false },
    { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=1200&fit=crop', original_name: 'casa-sorocaba-3.jpg', is_cover: false },
  ],
  3: [
    { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=1200&fit=crop', original_name: 'casa-itu-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1200&fit=crop', original_name: 'casa-itu-2.jpg', is_cover: false },
    { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=1200&fit=crop', original_name: 'casa-itu-3.jpg', is_cover: false },
  ],
  4: [
    { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=1200&fit=crop', original_name: 'terreno-votorantim-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=1200&fit=crop', original_name: 'terreno-votorantim-2.jpg', is_cover: false },
  ],
  5: [
    { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1200&fit=crop', original_name: 'terreno-salto-1.jpg', is_cover: true },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop', original_name: 'terreno-salto-2.jpg', is_cover: false },
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
      'condomínio fechado',
      'segurança 24h',
      'infraestrutura completa',
      'árvores',
      'área verde',
      'piscina',
      'churrasqueira',
      'próximo escola',
      'próximo comércio',
      'asfalto',
      'água',
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
      'vista panorâmica',
      'serra',
      'aclive',
      'árvores frutíferas',
      'mangueira',
      'jabuticabeira',
      'tranquilo',
      'residencial',
      'rua sem saída',
      'seguro',
      'documentação ok',
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
  {
    title: 'Casa 3 Quartos com Piscina - Sorocaba',
    description:
      'Linda casa com 3 quartos sendo 1 su\u00edte, sala ampla e arejada com ilumina\u00e7\u00e3o natural, cozinha planejada com arm\u00e1rios em MDF de alta qualidade. \u00c1rea gourmet completa com churrasqueira e balc\u00e3o em granito, ideal para receber amigos e fam\u00edlia. Piscina de alvenaria com deck em madeira, perfeita para os dias quentes do interior. Garagem coberta para 2 carros, quintal amplo com gramado e jardim. Localizada em bairro residencial tranquilo, pr\u00f3ximo a escolas renomadas e supermercados. Rua asfaltada e arborizada, com vizinhan\u00e7a familiar. Im\u00f3vel em excelente estado de conserva\u00e7\u00e3o, pronto para morar.',
    price: 520000,
    area: 180,
    type: 'casa',
    address: 'Rua dos Crisantemos, 412',
    city: 'Sorocaba',
    state: 'SP',
    neighborhood: 'Jardim Europa',
    characteristics: JSON.stringify([
      '3 quartos',
      'suite',
      'piscina',
      'churrasqueira',
      'área gourmet',
      'garagem 2 carros',
      'cozinha planejada',
      'quintal',
      'residencial',
      'próximo escola',
      'próximo supermercado',
    ]),
    latitude: -23.4869,
    longitude: -47.4525,
    details: JSON.stringify({
      bedrooms: 3,
      bathrooms: 2,
      garage: 2,
      pool: true,
      gated_community: false,
      paved_street: true,
    }),
  },
  {
    title: 'Casa T\u00e9rrea 4 Quartos em Condom\u00ednio - Itu',
    description:
      'Casa t\u00e9rrea moderna com acabamento de alto padr\u00e3o, 4 quartos sendo 2 su\u00edtes com closet e banheiros com box de vidro temperado. Living integrado com sala de estar e jantar em conceito aberto, piso porcelanato e p\u00e9-direito duplo. Cozinha americana com ilha central e eletrodom\u00e9sticos embutidos, lavabo social. \u00c1rea de lazer completa com piscina aquecida, espa\u00e7o gourmet com forno de pizza e churrasqueira, deck molhado e ducha. Condom\u00ednio fechado com seguran\u00e7a 24 horas, portaria blindada, clube com quadras de t\u00eanis e poliesportiva, academia equipada, playground e sal\u00e3o de festas. Garagem para 3 carros. Localiza\u00e7\u00e3o privilegiada na regi\u00e3o de Itu, cercada por natureza e com f\u00e1cil acesso \u00e0 Rodovia Castelo Branco.',
    price: 890000,
    area: 250,
    type: 'casa',
    address: 'Alameda das Ac\u00e1cias, 88',
    city: 'Itu',
    state: 'SP',
    neighborhood: 'Condom\u00ednio Residencial Fazenda Imperial',
    characteristics: JSON.stringify([
      'térrea',
      'moderna',
      '4 quartos',
      '2 suítes',
      'living integrado',
      'cozinha americana',
      'piscina aquecida',
      'espaço gourmet',
      'condomínio fechado',
      'segurança 24h',
      'academia',
      'quadras',
    ]),
    latitude: -23.2640,
    longitude: -47.2990,
    details: JSON.stringify({
      bedrooms: 4,
      bathrooms: 3,
      garage: 3,
      pool: true,
      gated_community: true,
      paved_street: true,
    }),
  },
  {
    title: 'Terreno 600m\u00b2 Plano em Bairro Nobre - Votorantim',
    description:
      'Terreno totalmente plano de 600m\u00b2, murado nos quatro lados, pronto para construir sem necessidade de terraplanagem. Localizado em bairro nobre com casas de alto padr\u00e3o e excelente vizinhan\u00e7a. Rua asfaltada e bem iluminada, com toda infraestrutura urbana: \u00e1gua encanada, rede de esgoto, energia el\u00e9trica e internet fibra \u00f3ptica. Pr\u00f3ximo ao centro de Votorantim e ao com\u00e9rcio local, com f\u00e1cil acesso a Sorocaba pela Rodovia Raposo Tavares. Documenta\u00e7\u00e3o totalmente regularizada, matr\u00edcula atualizada e IPTU em dia. Topografia ideal para projetos residenciais de m\u00e9dio e alto padr\u00e3o.',
    price: 250000,
    area: 600,
    type: 'terreno',
    address: 'Rua Professora Maria Jos\u00e9, 310',
    city: 'Votorantim',
    state: 'SP',
    neighborhood: 'Jardim Novo Mundo',
    characteristics: JSON.stringify([
      'plano',
      'murado',
      'alto padrão',
      'asfalto',
      'iluminação',
      'próximo centro',
      'próximo comércio',
      'documentação ok',
      'topografia ideal',
    ]),
    latitude: -23.5466,
    longitude: -47.4377,
    details: JSON.stringify({
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      pool: false,
      gated_community: false,
      paved_street: true,
    }),
  },
  {
    title: 'Terreno 1.000m\u00b2 com Mata Nativa - Salto',
    description:
      'Terreno amplo de 1.000m\u00b2 com mata nativa preservada, ideal para quem sonha com uma ch\u00e1cara ou casa de campo em contato direto com a natureza. Acesso por estrada de terra em bom estado de conserva\u00e7\u00e3o, transit\u00e1vel o ano todo. C\u00f3rrego cristalino nos fundos da propriedade, com \u00e1gua corrente e vegeta\u00e7\u00e3o ciliar preservada. Vista deslumbrante para as montanhas da regi\u00e3o, com nascer do sol privilegiado. \u00c1rea rural extremamente tranquila, com ar puro e sil\u00eancio, a apenas 10 minutos do centro de Salto. Perfeito para quem busca qualidade de vida, cultivo de horta e pomar, ou investimento em turismo rural. Regi\u00e3o em valoriza\u00e7\u00e3o constante.',
    price: 180000,
    area: 1000,
    type: 'terreno',
    address: 'Estrada do Pinhal, Km 5',
    city: 'Salto',
    state: 'SP',
    neighborhood: 'Zona Rural - Estrada do Pinhal',
    characteristics: JSON.stringify([
      'mata nativa',
      'chacara',
      'campo',
      'corrego',
      'vista montanhas',
      'rural',
      'tranquilo',
      'amplo',
      'natureza',
      'estrada terra',
    ]),
    latitude: -23.2003,
    longitude: -47.2869,
    details: JSON.stringify({
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      pool: false,
      gated_community: false,
      paved_street: false,
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
