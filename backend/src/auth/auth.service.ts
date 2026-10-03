import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';

import { PrismaService } from '../prisma/prisma.service';

interface RefreshTokenPayload {
  sub: number;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Access token: NÃO precisa de jti.
    const accessToken = await this.jwtService.signAsync({
      name: user.name,
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Refresh token: possui jti único.
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti: randomUUID(),
      },
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue,
      },
    );

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      10,
    );

    const refreshTokenExp = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        refreshTokenExp,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(
          refreshToken,
          {
            secret: this.configService.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (!user.refreshTokenHash || !user.refreshTokenExp) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (user.refreshTokenExp <= new Date()) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    // Novo access token: sem jti.
    const accessToken = await this.jwtService.signAsync({
      name: user.name,
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Novo refresh token: NOVO jti a cada rotação.
    const newRefreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        jti: randomUUID(),
      },
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue,
      },
    );

    const newRefreshTokenHash = await bcrypt.hash(
      newRefreshToken,
      10,
    );

    const newRefreshTokenExp = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        refreshTokenExp: newRefreshTokenExp,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExp: null,
      },
    });

    return {
      message: 'Logout successful',
    };
  }
}