import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '../generated/prisma/client';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksDto } from './dto/find-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findAll(userId: number, query: FindTasksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      ownerId: userId,

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),

      ...(query.priority
        ? {
            priority: query.priority,
          }
        : {}),

      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),

      ...(query.dueDateFrom || query.dueDateTo
        ? {
            dueDate: {
              ...(query.dueDateFrom
                ? {
                    gte: new Date(query.dueDateFrom),
                  }
                : {}),

              ...(query.dueDateTo
                ? {
                    lte: new Date(query.dueDateTo),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip,
        take: limit,
      }),

      this.prisma.task.count({
        where,
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, userId: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        client: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(userId: number, data: CreateTaskDto) {
    if (data.clientId !== undefined) {
      await this.validateClientOwnership(
        data.clientId,
        userId,
      );
    }

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : undefined,
        clientId: data.clientId,
        ownerId: userId,
      },
      include: {
        client: true,
      },
    });

    await this.activitiesService.create(
      userId,
      ActivityType.TASK_CREATED,
      `Task "${task.title}" created.`,
    );

    return task;
  }

  async update(
    id: number,
    userId: number,
    data: UpdateTaskDto,
  ) {
    await this.findById(id, userId);

    if (
      data.clientId !== undefined &&
      data.clientId !== null
    ) {
      await this.validateClientOwnership(
        data.clientId,
        userId,
      );
    }

    const task = await this.prisma.task.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate:
          data.dueDate === null
            ? null
            : data.dueDate !== undefined
              ? new Date(data.dueDate)
              : undefined,
        clientId: data.clientId,
      },
      include: {
        client: true,
      },
    });

    await this.activitiesService.create(
      userId,
      ActivityType.TASK_UPDATED,
      `Task "${task.title}" updated.`,
    );

    return task;
  }

  async remove(id: number, userId: number) {
    const task = await this.findById(id, userId);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    await this.activitiesService.create(
      userId,
      ActivityType.TASK_DELETED,
      `Task "${task.title}" deleted.`,
    );

    return {
      message: 'Task deleted successfully',
    };
  }

  private async validateClientOwnership(
    clientId: number,
    userId: number,
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        ownerId: userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }
}