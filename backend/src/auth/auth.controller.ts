import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './types/jwt-payload';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Authenticates a user and returns an access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Rotates the refresh token and returns a new access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the authenticated user information from the access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  me(
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return user;
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout current user',
    description:
      'Invalidates the current user refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  async logout(
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authService.logout(user.sub);
  }
}