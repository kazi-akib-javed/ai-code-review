import * as crypto from 'crypto';

const REQUIRED_ENV_VARS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
];

export function validateEnv(env: Record<string, string | undefined> = process.env): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const accessSecret = env.JWT_ACCESS_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET;

  if (!accessSecret || !isHighEntropy(accessSecret)) {
    throw new Error('JWT_ACCESS_SECRET does not meet security requirements');
  }

  if (!refreshSecret || !isHighEntropy(refreshSecret)) {
    throw new Error(
      'JWT_REFRESH_SECRET does not meet security requirements',
    );
  }

  function isHighEntropy(secret: string): boolean {
    const uniqueChars = new Set(secret.split('')).size;
    return secret.length >= 32 && uniqueChars >= 10;
  }

  const accessBuf = Buffer.from(accessSecret);
  const refreshBuf = Buffer.from(refreshSecret);
  const same =
    accessBuf.length === refreshBuf.length &&
    crypto.timingSafeEqual(accessBuf, refreshBuf);

  if (same) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }
}