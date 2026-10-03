import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Client name.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

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
}