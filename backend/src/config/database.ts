import { Pool, PoolConfig } from 'pg';
import { env } from './env';
import { isReleaseEnvironment } from './environment';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Enforce verified TLS in production if not disabled explicitly
if (isReleaseEnvironment(env.NODE_ENV)) {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA } : {}),
  };
} else if (env.DATABASE_URL.includes('sslmode=require')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err);
});
