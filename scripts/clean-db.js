// Script to clean all data from the database while keeping the schema
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.uicaqvmfalxtprjalqua:%25kzWRVg2%24agxmw%26@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    console.log('Adding password_hash column if not exists...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
    console.log('Done.');

    console.log('Truncating all tables...');
    await pool.query(`
      TRUNCATE TABLE campaign_recipients, campaigns, alert_matches, search_alerts,
      engagement_events, favorites, leads, property_images, properties, sellers,
      sessions, users RESTART IDENTITY CASCADE
    `);
    console.log('All tables truncated successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
