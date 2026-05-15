import { validateEnv } from './validate-env';

const validEnv = {
  JWT_ACCESS_SECRET: 'aB3$kL9#mN2@pQ7!rS5&tU8*vW1^xY4',
  JWT_REFRESH_SECRET: 'zA6%bC0+dE4-fG2=hI8?jK5.lM7/nO3',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'ai_code_review',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
};

describe('validateEnv', () => {
  it('should throw if JWT_ACCESS_SECRET has low entropy', () => {
    const env = {
      ...validEnv,
      JWT_ACCESS_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    };
    expect(() => validateEnv(env)).toThrow(
      'does not meet security requirements',
    );
  });

  it('should throw if JWT_REFRESH_SECRET has low entropy', () => {
    const env = {
      ...validEnv,
      JWT_REFRESH_SECRET: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    };
    expect(() => validateEnv(env)).toThrow(
      'does not meet security requirements',
    );
  });

  it('should throw if JWT_ACCESS_SECRET is too short', () => {
    const env = { ...validEnv, JWT_ACCESS_SECRET: 'short123!@#' };
    expect(() => validateEnv(env)).toThrow(
      'does not meet security requirements',
    );
  });

  it('should throw if JWT_REFRESH_SECRET is too short', () => {
    const env = { ...validEnv, JWT_REFRESH_SECRET: 'short123!@#' };
    expect(() => validateEnv(env)).toThrow(
      'does not meet security requirements',
    );
  });

  it('should throw if access and refresh secrets are the same', () => {
    const secret = 'aB3$kL9#mN2@pQ7!rS5&tU8*vW1^xY45d';
    const env = {
      ...validEnv,
      JWT_ACCESS_SECRET: secret,
      JWT_REFRESH_SECRET: secret,
    };
    expect(() => validateEnv(env)).toThrow('must be different');
  });
});
