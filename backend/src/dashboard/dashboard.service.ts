import { Injectable } from '@nestjs/common';

import {
  ClientStatus,
  TaskPriority,
  TaskStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(userId: number) {
    const now = new Date();

    const [
      totalClients,
      leadClients,
      activeClients,
      inactiveClients,

      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      highPriorityTasks,
      overdueTasks,

      recentActivities,
    ] = await Promise.all([
      this.prisma.client.count({
        where: {
          ownerId: userId,
        },
      }),

      this.prisma.client.count({
        where: {
          ownerId: userId,
          status: ClientStatus.LEAD,
        },
      }),

      this.prisma.client.count({
        where: {
          ownerId: userId,
          status: ClientStatus.ACTIVE,
        },
      }),

      this.prisma.client.count({
        where: {
          ownerId: userId,
          status: ClientStatus.INACTIVE,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
          status: TaskStatus.TODO,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
          status: TaskStatus.IN_PROGRESS,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
          status: TaskStatus.DONE,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
          priority: TaskPriority.HIGH,
        },
      }),

      this.prisma.task.count({
        where: {
          ownerId: userId,
          dueDate: {
            lt: now,
          },
          status: {
            not: TaskStatus.DONE,
          },
        },
      }),

      this.prisma.activity.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return {
      clients: {
        total: totalClients,
        lead: leadClients,
        active: activeClients,
        inactive: inactiveClients,
      },

      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        highPriority: highPriorityTasks,
        overdue: overdueTasks,
      },

      recentActivities,
    };
  }
}