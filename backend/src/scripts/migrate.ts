import path from 'path';
import { pool } from '../config/db';
import { migrate } from '../services/migration.service';

async function runMigrations() {
  try {
    const client = await pool.connect();
    try {
      const applied = await migrate(client, path.resolve(__dirname, '../../migrations'));
      console.log(`[Migration] Applied ${applied.length} new migration(s).`, applied);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Migration Error]:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
