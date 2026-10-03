import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ClientStatus } from '../generated/prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';

@ApiTags('Clients')
@ApiBearerAuth('access-token')
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create client',
    description:
      'Creates a new client owned by the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  create(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(
      user!.sub,
      createClientDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List clients',
    description:
      'Returns clients belonging to the authenticated user with pagination and optional filters.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of clients per page. Maximum: 100.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
    description: 'Filter clients by status.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Acme',
    description:
      'Search by client name, company, or email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of clients.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  findAll(
    @CurrentUser() user: JwtPayload | undefined,
    @Query() query: FindClientsDto,
  ) {
    return this.clientsService.findAll(
      user!.sub,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get client by ID',
    description:
      'Returns a client owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Client ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Client returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found.',
  })
  findOne(
    @CurrentUser() user: JwtPayload | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientsService.findById(
      id,
      user!.sub,
    );
  }

    @Put(':id')
  @ApiOperation({
    summary: 'Update client',
    description:
      'Updates a client owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Client ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully.',
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
    status: 404,
    description: 'Client not found.',
  })
  update(
    @CurrentUser() user: JwtPayload | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(
      id,
      user!.sub,
      updateClientDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete client',
    description:
      'Deletes a client owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Client ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Client deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found.',
  })
  remove(
    @CurrentUser() user: JwtPayload | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientsService.remove(
      id,
      user!.sub,
    );
  }
}