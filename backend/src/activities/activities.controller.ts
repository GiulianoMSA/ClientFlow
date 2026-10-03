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

import { ActivitiesService } from './activities.service';

@ApiTags('Activities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List current user activities',
    description:
      'Returns the activity history belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Activities returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  findAll(
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.activitiesService.findAll(user!.sub);
  }
}