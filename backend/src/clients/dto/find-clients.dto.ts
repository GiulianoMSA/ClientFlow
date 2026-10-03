import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { ClientStatus } from '../../generated/prisma/client';

export class FindClientsDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Page number.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    description: 'Number of clients per page.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
    description: 'Filter by client status.',
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiPropertyOptional({
    example: 'Acme',
    description:
      'Search by client name, company, or email.',
  })
  @IsOptional()
  @IsString()
  search?: string;
}