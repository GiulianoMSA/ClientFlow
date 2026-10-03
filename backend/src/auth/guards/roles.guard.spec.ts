import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../generated/prisma/client';
import { RolesGuard } from './roles.guard';
import { jest } from '@jest/globals';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: {
    getAllAndOverride: jest.Mock;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new RolesGuard(
      reflector as unknown as Reflector,
    );
  });

  function createContext(user?: unknown) {
    const request = {
      user,
    };

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };

    return context as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(
      guard.canActivate(createContext()),
    ).toBe(true);
  });

  it('should reject when authentication is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
    ]);

    expect(() =>
      guard.canActivate(createContext()),
    ).toThrow(ForbiddenException);
  });

  it('should reject when user does not have the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
    ]);

    expect(() =>
      guard.canActivate(
        createContext({
          sub: 1,
          email: 'user@clientflow.com',
          role: UserRole.USER,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('should allow access when user has the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
    ]);

    expect(
      guard.canActivate(
        createContext({
          sub: 1,
          email: 'admin@clientflow.local',
          role: UserRole.ADMIN,
        }),
      ),
    ).toBe(true);
  });
});