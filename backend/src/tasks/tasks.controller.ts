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

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksDto } from './dto/find-tasks.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create task',
    description: 'Creates a new task for the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid task data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Associated client not found.',
  })
  create(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(
      user!.sub,
      createTaskDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List tasks',
    description:
      'Returns a paginated list of tasks belonging to the authenticated user.',
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
    description: 'Number of tasks per page. Maximum: 100.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['TODO', 'IN_PROGRESS', 'DONE'],
    example: 'TODO',
    description: 'Filter tasks by status.',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'HIGH',
    description: 'Filter tasks by priority.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'proposta',
    description:
      'Search by task title or description.',
  })
  @ApiQuery({
    name: 'dueDateFrom',
    required: false,
    type: String,
    example: '2026-10-01T00:00:00.000Z',
    description:
      'Filter tasks with due date from this date.',
  })
  @ApiQuery({
    name: 'dueDateTo',
    required: false,
    type: String,
    example: '2026-10-31T23:59:59.999Z',
    description:
      'Filter tasks with due date up to this date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  findAll(
    @CurrentUser() user: JwtPayload | undefined,
    @Query() query: FindTasksDto,
  ) {
    return this.tasksService.findAll(
      user!.sub,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get task by ID',
    description:
      'Returns a specific task belonging to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Task ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.tasksService.findById(
      id,
      user!.sub,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update task',
    description:
      'Updates a task belonging to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Task ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid task data.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Task or associated client not found.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(
      id,
      user!.sub,
      updateTaskDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete task',
    description:
      'Deletes a task belonging to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Task ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.tasksService.remove(
      id,
      user!.sub,
    );
  }
}