import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  DeepMockProxy,
  mockDeep,
} from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;
  let configService: DeepMockProxy<ConfigService>;

  const user = {
    id: 1,
    email: 'user@clientflow.com',
    password: '',
    name: 'Test User',
    role: 'USER' as const,
    refreshTokenHash: null,
    refreshTokenExp: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    jwtService = mockDeep<JwtService>();
    configService = mockDeep<ConfigService>();

    configService.getOrThrow.mockImplementation(
      (key: string) => {
        const values: Record<string, string> = {
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };

        return values[key];
      },
    );

    service = new AuthService(
      prisma,
      jwtService,
      configService,
    );
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(
        'Senha123',
        10,
      );

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        password: hashedPassword,
      });

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue({
        ...user,
        password: hashedPassword,
        refreshTokenHash: 'hashed-refresh-token',
        refreshTokenExp: new Date(),
      });

      const result = await service.login(
        'user@clientflow.com',
        'Senha123',
      );

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'user@clientflow.com',
        },
      });

      // Access token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: 1,
          email: 'user@clientflow.com',
          role: 'USER',
        },
      );

      // Refresh token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: 1,
          jti: expect.any(String),
        }),
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: expect.objectContaining({
            refreshTokenHash: expect.any(String),
            refreshTokenExp: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(
          'unknown@clientflow.com',
          'Senha123',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash(
        'SenhaCorreta123',
        10,
      );

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        password: hashedPassword,
      });

      await expect(
        service.login(
          'user@clientflow.com',
          'SenhaErrada123',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'refresh-token';

      const refreshTokenHash = await bcrypt.hash(
        refreshToken,
        10,
      );

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash,
        refreshTokenExp: new Date(
          Date.now() + 60 * 60 * 1000,
        ),
      });

      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        jti: 'old-refresh-token-id',
      });

      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      prisma.user.update.mockResolvedValue({
        ...user,
        refreshTokenHash: 'new-hash',
        refreshTokenExp: new Date(),
      });

      const result = await service.refreshToken(
        refreshToken,
      );

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        refreshToken,
        {
          secret: 'refresh-secret',
        },
      );

      // Novo access token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: 1,
          email: 'user@clientflow.com',
          role: 'USER',
        },
      );

      // Novo refresh token
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: 1,
          jti: expect.any(String),
        }),
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        },
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
          data: expect.objectContaining({
            refreshTokenHash: expect.any(String),
            refreshTokenExp: expect.any(Date),
          }),
        }),
      );
    });

    it('should reject an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.refreshToken('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should reject a refresh token when user does not exist', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 999,
        jti: 'refresh-token-id',
      });

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when refresh token hash is missing', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        jti: 'refresh-token-id',
      });

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash: null,
        refreshTokenExp: new Date(
          Date.now() + 60 * 60 * 1000,
        ),
      });

      await expect(
        service.refreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when refresh token expiration is missing', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        jti: 'refresh-token-id',
      });

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash: 'some-hash',
        refreshTokenExp: null,
      });

      await expect(
        service.refreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject an expired refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        jti: 'refresh-token-id',
      });

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash: 'some-hash',
        refreshTokenExp: new Date(
          Date.now() - 60 * 1000,
        ),
      });

      await expect(
        service.refreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject when refresh token does not match stored hash', async () => {
      const differentTokenHash = await bcrypt.hash(
        'different-token',
        10,
      );

      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        jti: 'refresh-token-id',
      });

      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash: differentTokenHash,
        refreshTokenExp: new Date(
          Date.now() + 60 * 60 * 1000,
        ),
      });

      await expect(
        service.refreshToken('refresh-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        refreshTokenHash: 'hashed-refresh-token',
        refreshTokenExp: new Date(
          Date.now() + 60 * 60 * 1000,
        ),
      });

      prisma.user.update.mockResolvedValue({
        ...user,
        refreshTokenHash: null,
        refreshTokenExp: null,
      });

      const result = await service.logout(1);

      expect(result).toEqual({
        message: 'Logout successful',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          refreshTokenHash: null,
          refreshTokenExp: null,
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.logout(999),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});