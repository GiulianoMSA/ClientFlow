import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from '../generated/prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List users',
    description: 'Returns all registered users. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN users can access this endpoint.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a user by their numeric ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create user',
    description: 'Creates a new user. Requires ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN users can create users.',
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists.',
  })
  create(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      createUserDto,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an existing user. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN users can update users.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes an existing user. Requires ADMIN role.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only ADMIN users can delete users.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(id);
  }
}