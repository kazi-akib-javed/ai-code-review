import { validateEnv } from './validate-env';

const validEnv = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'ai_code_review',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
};

describe('validateEnv', () => {
  it('should pass with valid environment variables', () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('should throw if required env var is missing', () => {
    const env = { ...validEnv };
    delete env.JWT_ACCESS_SECRET;
    expect(() => validateEnv(env)).toThrow('Missing required environment variables');
  });

  it('should throw if JWT_ACCESS_SECRET is too short', () => {
    const env = { ...validEnv, JWT_ACCESS_SECRET: 'short' };
    expect(() => validateEnv(env)).toThrow('JWT_ACCESS_SECRET must be at least 32 characters');
  });

  it('should throw if JWT_REFRESH_SECRET is too short', () => {
    const env = { ...validEnv, JWT_REFRESH_SECRET: 'short' };
    expect(() => validateEnv(env)).toThrow('JWT_REFRESH_SECRET must be at least 32 characters');
  });

  it('should throw if access and refresh secrets are the same', () => {
    const secret = 'a'.repeat(32);
    const env = { ...validEnv, JWT_ACCESS_SECRET: secret, JWT_REFRESH_SECRET: secret };
    expect(() => validateEnv(env)).toThrow('must be different');
  });
});