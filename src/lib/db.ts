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
      type TEXT NOT NULL CHECK(type IN ('terreno', 'casa', 'apartamento', 'comercial', 'rural')),
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
  `);
}

// Call initDB on module load
initDB().catch(console.error);
