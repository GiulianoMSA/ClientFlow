import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { ClientStatus } from '../../generated/prisma/client';

export class UpdateClientDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Client name.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Acme Corporation',
    description: 'Client company.',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Client email address.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+55 61 99999-0000',
    description: 'Client phone number.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
    description: 'Client status.',
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}