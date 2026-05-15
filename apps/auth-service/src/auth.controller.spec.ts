import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '@app/shared';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-value'),
};

const mockTokenService = {
  storeRefreshToken: jest.fn().mockResolvedValue(undefined),
  validateRefreshToken: jest.fn().mockResolvedValue(true),
  revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(
        service.register({ email: 'test@test.com', password: 'password123', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return tokens for new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: '1', email: 'test@test.com' });
      mockUserRepository.save.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockTokenService.storeRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: await bcrypt.hash('otherpassword', 12),
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 12);
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashed,
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockTokenService.storeRefreshToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });
      mockTokenService.validateRefreshToken.mockResolvedValue(false);

      await expect(
        service.refreshTokens('1', 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens on valid refresh token', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
      });
      mockTokenService.validateRefreshToken.mockResolvedValue(true);

      const result = await service.refreshTokens('1', 'valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      await service.logout('user-1');
      expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('user-1');
    });
  });
});