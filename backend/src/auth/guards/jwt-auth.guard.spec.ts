import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: {
    verifyAsync: jest.Mock;
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
    );
  });

  function createContext(authorization?: string) {
    const request: {
      headers: {
        authorization?: string;
      };
      user?: unknown;
    } = {
      headers: {},
    };

    if (authorization !== undefined) {
      request.headers.authorization = authorization;
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return {
      context: context as unknown as ExecutionContext,
      request,
    };
  }

  it('should reject when authorization header is missing', async () => {
    const { context } = createContext();

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an invalid authorization header', async () => {
    const { context } = createContext('Basic abc123');

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject when token is missing', async () => {
    const { context } = createContext('Bearer');

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(
      new Error('Invalid token'),
    );

    const { context } = createContext('Bearer invalid-token');

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should allow a valid token and attach the payload to request.user', async () => {
    const payload = {
      sub: 1,
      email: 'user@clientflow.com',
      role: 'USER',
    };

    jwtService.verifyAsync.mockResolvedValue(payload);

    const { context, request } = createContext(
      'Bearer valid-token',
    );

    await expect(
      guard.canActivate(context),
    ).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
    );

    expect(request.user).toEqual(payload);
  });
});