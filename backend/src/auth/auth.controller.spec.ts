import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { jest } from '@jest/globals';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;

  let authService: {
    login: jest.Mock;
    refreshToken: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

    controller = module.get<AuthController>(
      AuthController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login through AuthService', async () => {
    const dto: LoginDto = {
      email: 'user@clientflow.com',
      password: 'Senha123',
    };

    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await controller.login(dto);

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(authService.login).toHaveBeenCalledWith(
      dto.email,
      dto.password,
    );
  });

  it('should refresh the token through AuthService', async () => {
    const dto: RefreshTokenDto = {
      refreshToken: 'refresh-token',
    };

    authService.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const result = await controller.refresh(dto);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(authService.refreshToken).toHaveBeenCalledWith(
      dto.refreshToken,
    );
  });

  it('should return the current user', () => {
    const user = {
      sub: 1,
      email: 'user@clientflow.com',
      role: 'USER' as const,
    };

    expect(controller.me(user)).toEqual(user);
  });

  it('should logout the current user', async () => {
    authService.logout.mockResolvedValue({
      message: 'Logout successful',
    });

    const user = {
      sub: 1,
      email: 'user@clientflow.com',
      role: 'USER' as const,
    };

    const result = await controller.logout(user);

    expect(result).toEqual({
      message: 'Logout successful',
    });

    expect(authService.logout).toHaveBeenCalledWith(1);
  });


it('should reject logout without an authenticated user', () => {
  expect(() => controller.logout(undefined)).toThrow(
    'User not authenticated',
  );

  expect(authService.logout).not.toHaveBeenCalled();
});
});