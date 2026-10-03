import {
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    description: 'Refresh token issued during authentication.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}