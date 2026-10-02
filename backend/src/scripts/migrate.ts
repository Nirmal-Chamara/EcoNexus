import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[Migration] Starting database migrations...');
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`[Migration] Running ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`[Migration] Completed ${file}`);
    }

    console.log('[Migration] All migrations completed successfully.');
  } catch (error) {
    console.error('[Migration Error]:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
