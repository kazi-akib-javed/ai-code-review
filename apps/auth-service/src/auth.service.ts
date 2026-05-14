import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity, JwtPayload } from '@app/shared';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    return this.generateAndStoreTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAndStoreTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await this.tokenService.validateRefreshToken(
      userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateAndStoreTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(userId);
  }

  private async generateAndStoreTokens(user: UserEntity) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.tokenService.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, userId: user.id };
  }
}