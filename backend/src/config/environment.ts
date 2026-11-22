import { randomBytes } from 'crypto';
import { z } from 'zod';
import { isSafeProvisioningPassword } from '../utils/credentialPolicy';

export function isReleaseEnvironment(name: string): boolean {
  return name === 'production' || name === 'staging';
}

/** Errors identify settings only; never include their values or parser dumps. */
export function readEnvironment(source: NodeJS.ProcessEnv) {
  const name = source.NODE_ENV || '';
  if (!['development', 'test', 'staging', 'production'].includes(name))
    throw new Error(
      'NODE_ENV must explicitly be development, test, staging or production'
    );
  const release = isReleaseEnvironment(name);
  const required = (key: string): string => {
    const value = source[key]?.trim();
    if (!value) throw new Error(`${key} is required`);
    return value;
  };
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const value = source[key] === undefined ? fallback : Number(source[key]);
    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error(`${key} is outside the supported range`);
    return value;
  };
  const databaseUrl =
    source.DATABASE_URL ||
    (release
      ? required('DATABASE_URL')
      : 'postgres://postgres:postgres@localhost:5432/econexus');
  let parsedDatabase: URL;
  try {
    parsedDatabase = new URL(databaseUrl);
    if (
      !['postgres:', 'postgresql:'].includes(parsedDatabase.protocol) ||
      !parsedDatabase.hostname ||
      parsedDatabase.pathname.length < 2
    )
      throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }
  let safeDatabaseUrl = databaseUrl;
  if (
    release &&
    ['', 'postgres', 'password', 'changeme'].includes(
      decodeURIComponent(parsedDatabase.password).toLowerCase()
    )
  )
    throw new Error(
      'DATABASE_URL requires nondefault database credentials in release environments'
    );
  const secret =
    source.JWT_ACCESS_SECRET ||
    (release ? required('JWT_ACCESS_SECRET') : randomBytes(48).toString('hex'));
  const placeholder =
    /fallback|change.?in.?prod|super_secret|replace|changeme|example|unit_test/i;
  if (release && (Buffer.byteLength(secret) < 32 || placeholder.test(secret)))
    throw new Error(
      'JWT_ACCESS_SECRET must be a generated secret of at least 32 bytes'
    );
  const accessTtl = source.ACCESS_TOKEN_TTL || '15m';
  const secondsPerUnit: Record<string, number> = { s: 1, m: 60, h: 3600 };
  const ttl = /^([1-9]\d*)(s|m|h)$/.exec(accessTtl);
  if (!ttl || Number(ttl[1]) * (secondsPerUnit[ttl[2]] || 0) > 3600)
    throw new Error(
      'ACCESS_TOKEN_TTL must be a positive duration up to one hour using s, m or h'
    );
  const cors = source.CORS_ORIGIN || '';
  if (release) {
    if (!/^[a-fA-F0-9]{64}$/.test(required('EMAIL_OUTBOX_KEY')))
      throw new Error('EMAIL_OUTBOX_KEY must be a generated 32-byte hex key');
    try {
      const link = new URL(required('APP_LINK_BASE_URL'));
      if (
        link.protocol !== 'https:' ||
        link.username ||
        link.password ||
        link.search ||
        link.hash
      )
        throw new Error();
    } catch {
      throw new Error('APP_LINK_BASE_URL must be an owned HTTPS app URL');
    }
    for (const key of parsedDatabase.searchParams.keys()) {
      if (!['sslmode', 'application_name', 'connect_timeout'].includes(key)) {
        throw new Error(
          'DATABASE_URL contains unsupported connection overrides; configure database TLS through the server settings'
        );
      }
    }
    if (!cors.trim())
      throw new Error('CORS_ORIGIN is required in release environments');
    for (const origin of cors.split(',').map((value) => value.trim())) {
      try {
        const url = new URL(origin);
        if (
          url.protocol !== 'https:' ||
          url.origin !== origin ||
          url.username ||
          url.password
        )
          throw new Error();
      } catch {
        throw new Error('CORS_ORIGIN must list exact HTTPS origins');
      }
    }
    if (source.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false')
      throw new Error(
        'Database TLS verification cannot be disabled in release environments'
      );
    if (
      parsedDatabase.searchParams.has('sslmode') &&
      parsedDatabase.searchParams.get('sslmode') !== 'verify-full'
    )
      throw new Error(
        'DATABASE_URL sslmode must be verify-full when provided in release environments'
      );
    // pg parses URL SSL options after PoolConfig and can replace its CA/SSL
    // object. Keep release TLS exclusively in our verified PoolConfig instead.
    parsedDatabase.searchParams.delete('sslmode');
    safeDatabaseUrl = parsedDatabase.toString();
    const googleClients = required('GOOGLE_CLIENT_ID')
      .split(',')
      .map((value) => value.trim());
    if (
      googleClients.some(
        (value) => !/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(value)
      )
    )
      throw new Error('GOOGLE_CLIENT_ID must contain Google OAuth client IDs');
    const smtpComplete =
      source.SMTP_HOST && source.SMTP_USER && source.SMTP_PASSWORD;
    if (!source.RESEND_API_KEY && !smtpComplete)
      throw new Error(
        'A transactional email provider must be configured in release environments'
      );
    const from = required('EMAIL_FROM');
    const address = /<([^<>]+)>$/.exec(from)?.[1] || from;
    if (
      !z.string().email().safeParse(address).success ||
      /@(resend\.dev|example\.(com|org|net))$/i.test(address)
    )
      throw new Error(
        'EMAIL_FROM must use the configured owned sending domain'
      );
    if (
      source.ADMIN_PASSWORD &&
      !isSafeProvisioningPassword(source.ADMIN_PASSWORD)
    )
      throw new Error(
        'ADMIN_PASSWORD cannot use example/default provisioning credentials'
      );
  }
  return {
    PORT: integer('PORT', 4000, 1, 65535),
    DATABASE_URL: safeDatabaseUrl,
    JWT_ACCESS_SECRET: secret,
    ACCESS_TOKEN_TTL: accessTtl,
    REFRESH_TOKEN_TTL_DAYS: integer('REFRESH_TOKEN_TTL_DAYS', 14, 1, 90),
    BCRYPT_ROUNDS: integer('BCRYPT_ROUNDS', 12, release ? 10 : 4, 15),
    NODE_ENV: name,
    ADMIN_EMAIL: source.ADMIN_EMAIL || '',
    ADMIN_PASSWORD: source.ADMIN_PASSWORD || '',
    ADMIN_NAME: source.ADMIN_NAME || 'System Administrator',
    ADMIN_PROVISIONED_BY: source.ADMIN_PROVISIONED_BY || '',
    ADMIN_PROVISION_REASON: source.ADMIN_PROVISION_REASON || '',
    SMTP_HOST: source.SMTP_HOST || '',
    SMTP_PORT: integer('SMTP_PORT', 587, 1, 65535),
    SMTP_USER: source.SMTP_USER || '',
    SMTP_PASSWORD: source.SMTP_PASSWORD || '',
    EMAIL_FROM: source.EMAIL_FROM || '',
    RESEND_API_KEY: source.RESEND_API_KEY || '',
    GOOGLE_CLIENT_ID: source.GOOGLE_CLIENT_ID || '',
    CORS_ORIGIN: cors,
    DATABASE_SSL_CA: source.DATABASE_SSL_CA?.replace(/\\n/g, '\n') || '',
    EMAIL_OUTBOX_KEY: source.EMAIL_OUTBOX_KEY || '',
    APP_LINK_BASE_URL: source.APP_LINK_BASE_URL || 'econexus://',
  };
}
