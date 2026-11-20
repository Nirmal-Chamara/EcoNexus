import { readEnvironment } from '../config/environment';

const release: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL:
    'postgres://service:nondefault-long-db-secret@db.example.test/econexus',
  JWT_ACCESS_SECRET:
    'a49f37428b850eacf415a35dd4ed8bc66327f6bb96874a6cf63665fde15e9a2e',
  CORS_ORIGIN: 'https://app.example.test',
  GOOGLE_CLIENT_ID: '123-client.apps.googleusercontent.com',
  RESEND_API_KEY: 'provider-test-fixture',
  EMAIL_FROM: 'EcoNexus <accounts@econexus.test>',
  EMAIL_OUTBOX_KEY: '1'.repeat(64),
  APP_LINK_BASE_URL: 'https://app.econexus.test',
};

it.each(['production', 'staging'])(
  'accepts complete explicit %s configuration',
  (name) => {
    const env = readEnvironment({ ...release, NODE_ENV: name });
    expect(env.NODE_ENV).toBe(name);
    expect(env.ADMIN_PASSWORD).toBe('');
  }
);
it.each(['', 'prod', 'dev', 'unknown'])(
  'rejects absent or misspelled environment: %s',
  (name) => {
    expect(() => readEnvironment({ NODE_ENV: name })).toThrow('NODE_ENV');
  }
);
it.each([
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'GOOGLE_CLIENT_ID',
  'EMAIL_FROM',
  'CORS_ORIGIN',
] as const)('requires %s for releases', (key) => {
  expect(() => readEnvironment({ ...release, [key]: '' })).toThrow(key);
});
it.each([
  'fallback_secret_key_change_in_production',
  'short',
  'super_secret_econexus_access_jwt_key_2026_change_in_prod',
])('rejects unsafe JWT secrets', (secret) => {
  expect(() =>
    readEnvironment({ ...release, JWT_ACCESS_SECRET: secret })
  ).toThrow('JWT_ACCESS_SECRET');
});
it('does not expose a secret value in configuration errors', () => {
  const secret = 'sensitive-short';
  try {
    readEnvironment({ ...release, JWT_ACCESS_SECRET: secret });
    throw new Error('Expected failure');
  } catch (error) {
    expect(String(error)).not.toContain(secret);
    expect(String(error)).toContain('JWT_ACCESS_SECRET');
  }
});
it('rejects default production database credentials', () => {
  expect(() =>
    readEnvironment({
      ...release,
      DATABASE_URL: 'postgres://postgres:postgres@db/econexus',
    })
  ).toThrow('nondefault');
});
it.each([
  '*',
  'http://app.example.test',
  'https://app.example.test/path',
  'https://user:password@app.example.test',
])('rejects unsafe CORS origins', (origin) => {
  expect(() => readEnvironment({ ...release, CORS_ORIGIN: origin })).toThrow(
    'CORS_ORIGIN'
  );
});
it('does not permit disabling database certificate validation', () => {
  expect(() =>
    readEnvironment({ ...release, DATABASE_SSL_REJECT_UNAUTHORIZED: 'false' })
  ).toThrow('TLS');
  expect(() =>
    readEnvironment({
      ...release,
      DATABASE_URL: `${release.DATABASE_URL}?sslmode=require`,
    })
  ).toThrow('sslmode');
});
it.each(['onboarding@resend.dev', 'Admin <admin@example.com>'])(
  'rejects development sender identities',
  (sender) => {
    expect(() => readEnvironment({ ...release, EMAIL_FROM: sender })).toThrow(
      'EMAIL_FROM'
    );
  }
);
it('requires configured email delivery rather than console delivery in release', () => {
  expect(() => readEnvironment({ ...release, RESEND_API_KEY: '' })).toThrow(
    'email provider'
  );
});

it('requires a valid stable outbox encryption key and an owned HTTPS link base for release', () => {
  expect(() => readEnvironment({ ...release, EMAIL_OUTBOX_KEY: '' })).toThrow('EMAIL_OUTBOX_KEY');
  expect(() => readEnvironment({ ...release, EMAIL_OUTBOX_KEY: 'not-a-key' })).toThrow('EMAIL_OUTBOX_KEY');
  expect(() => readEnvironment({ ...release, APP_LINK_BASE_URL: 'http://app.econexus.test' })).toThrow('APP_LINK_BASE_URL');
});
it.each(['AdminPass123!', 'short', 'alllowercasewith123'])(
  'rejects unsafe provisioning credentials in runtime release settings',
  (password) => {
    expect(() =>
      readEnvironment({ ...release, ADMIN_PASSWORD: password })
    ).toThrow('ADMIN_PASSWORD');
  }
);

it.each([
  'ssl=0',
  'sslmode=no-verify',
  'host=elsewhere.test',
  'password=postgres',
])(
  'does not let connection URL options override release policy: %s',
  (query) => {
    expect(() =>
      readEnvironment({
        ...release,
        DATABASE_URL: `${release.DATABASE_URL}?${query}`,
      })
    ).toThrow('DATABASE_URL');
  }
);
it.each([
  ['PORT', 'NaN'],
  ['PORT', '0'],
  ['BCRYPT_ROUNDS', '4'],
  ['BCRYPT_ROUNDS', '999'],
  ['REFRESH_TOKEN_TTL_DAYS', '-1'],
  ['ACCESS_TOKEN_TTL', '30d'],
])('rejects invalid numeric/duration setting %s=%s', (key, value) => {
  expect(() => readEnvironment({ ...release, [key]: value })).toThrow(key);
});
it('uses an ephemeral development secret rather than a shared built-in secret', () => {
  const first = readEnvironment({ NODE_ENV: 'development' });
  const second = readEnvironment({ NODE_ENV: 'development' });
  expect(first.JWT_ACCESS_SECRET).not.toBe(second.JWT_ACCESS_SECRET);
});
