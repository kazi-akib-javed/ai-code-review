import * as crypto from 'crypto';

const MIN_SECRET_LENGTH = 32;

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

  if (!accessSecret || accessSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  if (!refreshSecret || refreshSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
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