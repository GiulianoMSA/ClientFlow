import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address of the user.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Password used to authenticate the user.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}