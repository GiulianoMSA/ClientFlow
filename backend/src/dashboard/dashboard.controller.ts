import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload';

import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard',
    description:
      'Returns dashboard statistics and summary data for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  getDashboard(
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.dashboardService.getDashboard(
      user!.sub,
    );
  }
}