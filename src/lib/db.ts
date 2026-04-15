import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export async function getOne(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

export async function getAll(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      area DOUBLE PRECISION NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('terreno', 'casa', 'apartamento', 'comercial', 'rural', 'terreno_condominio', 'casa_condominio')),
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'SP',
      neighborhood TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'sold')),
      characteristics TEXT,
      details TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      is_cover INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar_url TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'form' CHECK(source IN ('form', 'whatsapp')),
      status TEXT NOT NULL DEFAULT 'novo' CHECK(status IN ('novo', 'contatado', 'convertido', 'descartado')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, property_id)
    );

    CREATE TABLE IF NOT EXISTS search_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS alert_matches (
      id SERIAL PRIMARY KEY,
      alert_id INTEGER NOT NULL REFERENCES search_alerts(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      score DOUBLE PRECISION NOT NULL,
      reasons TEXT NOT NULL,
      seen INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(alert_id, property_id)
    );

    CREATE TABLE IF NOT EXISTS engagement_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK(event_type IN ('view_half', 'view_complete', 'like', 'unlike', 'share', 'click_details', 'click_whatsapp', 'click_buy')),
      duration_seconds INTEGER DEFAULT 0,
      metadata TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_temperature TEXT NOT NULL CHECK(target_temperature IN ('frio', 'morno', 'quente', 'todos')),
      property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      opened_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      seller_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      buyer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(property_id, seller_user_id, buyer_user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

    CREATE TABLE IF NOT EXISTS platform_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO platform_config (key, value) VALUES ('commission_rate', '5') ON CONFLICT (key) DO NOTHING;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

    UPDATE users SET is_admin = TRUE WHERE email = 'rasa.larig@gmail.com';

    CREATE TABLE IF NOT EXISTS premium_codes (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      max_uses INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS premium_activations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_id INTEGER NOT NULL REFERENCES premium_codes(id),
      activated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, code_id)
    );

    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intermediation_status TEXT DEFAULT 'none' CHECK(intermediation_status IN ('none', 'active', 'closed'));
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intermediation_notes TEXT;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS intermediation_started_at TIMESTAMPTZ;

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS media_status TEXT NOT NULL DEFAULT 'ready' CHECK(media_status IN ('ready', 'processing'));

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved TEXT NOT NULL DEFAULT 'pending' CHECK(approved IN ('pending', 'approved', 'rejected'));

    -- Auto-approve existing properties that were created before the approval system
    UPDATE properties SET approved = 'approved' WHERE approved = 'pending' AND created_at < '2026-04-11';

    CREATE TABLE IF NOT EXISTS contact_violations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      attempted_message TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_seller_terms BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_seller_terms_at TIMESTAMPTZ;

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_privacy VARCHAR(20) DEFAULT 'exact' CHECK(address_privacy IN ('exact', 'approximate'));
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS approximate_radius_km DECIMAL(3,1) DEFAULT 1.0;

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS facade_orientation VARCHAR(20) CHECK(facade_orientation IN ('norte', 'sul', 'leste', 'oeste', 'nordeste', 'noroeste', 'sudeste', 'sudoeste'));

    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_type VARCHAR(20) NOT NULL CHECK(profile_type IN ('autonomo', 'imobiliaria', 'proprietario', 'comprador')),
      creci VARCHAR(50),
      trade_name VARCHAR(200),
      cnpj VARCHAR(20),
      area_of_operation TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, profile_type)
    );

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS allow_resale BOOLEAN DEFAULT FALSE;
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS resale_commission_percent DECIMAL(5,2);
    ALTER TABLE properties ADD COLUMN IF NOT EXISTS resale_terms TEXT;

    -- Auto-create 'comprador' profile for all existing users that don't have one yet
    INSERT INTO user_profiles (user_id, profile_type)
    SELECT id, 'comprador' FROM users
    WHERE id NOT IN (SELECT user_id FROM user_profiles WHERE profile_type = 'comprador')
    ON CONFLICT (user_id, profile_type) DO NOTHING;

    -- Auto-create 'proprietario' profile for users with accepted_seller_terms = TRUE
    INSERT INTO user_profiles (user_id, profile_type)
    SELECT id, 'proprietario' FROM users
    WHERE accepted_seller_terms = TRUE
      AND id NOT IN (SELECT user_id FROM user_profiles WHERE profile_type = 'proprietario')
    ON CONFLICT (user_id, profile_type) DO NOTHING;

    -- Multi-tours feature tables
    CREATE TABLE IF NOT EXISTS property_tours (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      title VARCHAR(200),
      description TEXT,
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deleted')),
      moderation_status VARCHAR(20) DEFAULT 'pending' CHECK(moderation_status IN ('pending', 'approved', 'rejected')),
      moderation_result JSONB,
      is_original BOOLEAN DEFAULT FALSE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tour_media (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL REFERENCES property_tours(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type VARCHAR(20) DEFAULT 'image' CHECK(media_type IN ('image', 'video', 'youtube', 'vimeo', 'tiktok', 'instagram')),
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Condominiums feature
    CREATE TABLE IF NOT EXISTS condominiums (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(200) UNIQUE NOT NULL,
      description TEXT,
      city VARCHAR(100),
      state VARCHAR(2),
      neighborhood VARCHAR(100),
      amenities TEXT[],
      lat DECIMAL(10, 7),
      lng DECIMAL(10, 7),
      cover_image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE properties ADD COLUMN IF NOT EXISTS condominium_id INTEGER REFERENCES condominiums(id);

    -- Smart interest profile fields for search_alerts
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS profile_name VARCHAR(100);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS property_type VARCHAR(50);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS max_price DECIMAL(15,2);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS min_area DECIMAL(10,2);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS state VARCHAR(2);
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS min_bedrooms INTEGER;
    ALTER TABLE search_alerts ADD COLUMN IF NOT EXISTS must_have_characteristics TEXT[];

    -- read_at for alert_matches (replaces seen integer with proper timestamp)
    ALTER TABLE alert_matches ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

    -- POI cache table
    CREATE TABLE IF NOT EXISTS property_pois_cache (
      property_id INTEGER PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
      data JSONB NOT NULL,
      fetched_at TIMESTAMP DEFAULT NOW()
    );

    -- Migration: create an original tour for each property that doesn't have one yet,
    -- and migrate their property_images into tour_media.
    INSERT INTO property_tours (property_id, title, status, moderation_status, is_original, created_at, updated_at)
    SELECT p.id, p.title, 'active', 'approved', TRUE, p.created_at, p.updated_at
    FROM properties p
    WHERE NOT EXISTS (
      SELECT 1 FROM property_tours pt WHERE pt.property_id = p.id AND pt.is_original = TRUE
    );

    INSERT INTO tour_media (tour_id, media_url, media_type, display_order, created_at)
    SELECT
      pt.id,
      pi.filename,
      CASE
        WHEN pi.filename ~* '\.(mp4|mov|webm|avi)$' THEN 'video'
        WHEN pi.filename ~* 'youtube\.com|youtu\.be' THEN 'youtube'
        WHEN pi.filename ~* 'vimeo\.com' THEN 'vimeo'
        WHEN pi.filename ~* 'tiktok\.com' THEN 'tiktok'
        WHEN pi.filename ~* 'instagram\.com' THEN 'instagram'
        ELSE 'image'
      END,
      ROW_NUMBER() OVER (PARTITION BY pi.property_id ORDER BY pi.is_cover DESC, pi.id ASC) - 1,
      pi.created_at
    FROM property_images pi
    JOIN property_tours pt ON pt.property_id = pi.property_id AND pt.is_original = TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM tour_media tm WHERE tm.tour_id = pt.id AND tm.media_url = pi.filename
    );
  `);
}

// Call initDB on module load
initDB().catch(console.error);
