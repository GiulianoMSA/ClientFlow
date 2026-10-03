import {
  DeepMockProxy,
  mockDeep,
} from 'jest-mock-extended';
import { jest } from '@jest/globals';

import {
  ClientStatus,
  TaskPriority,
  TaskStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();

    service = new DashboardService(prisma);
  });

  it('should return dashboard statistics for the user', async () => {
    prisma.client.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(1);

    prisma.task.count
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    const activities = [
      {
        id: 1,
        type: 'TASK_CREATED' as const,
        message: 'Task "Test" created.',
        userId: 1,
        createdAt: new Date(),
      },
    ];

    prisma.activity.findMany.mockResolvedValue(
      activities,
    );

    const result = await service.getDashboard(1);

    expect(result).toEqual({
      clients: {
        total: 10,
        lead: 3,
        active: 6,
        inactive: 1,
      },
      tasks: {
        total: 15,
        todo: 5,
        inProgress: 7,
        done: 3,
        highPriority: 4,
        overdue: 2,
      },
      recentActivities: activities,
    });
  });

  it('should query client statistics only for the current user', async () => {
    prisma.client.count.mockResolvedValue(0);

    prisma.task.count.mockResolvedValue(0);

    prisma.activity.findMany.mockResolvedValue([]);

    await service.getDashboard(42);

    expect(prisma.client.count).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          ownerId: 42,
        },
      },
    );

    expect(prisma.client.count).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          ownerId: 42,
          status: ClientStatus.LEAD,
        },
      },
    );

    expect(prisma.client.count).toHaveBeenNthCalledWith(
      3,
      {
        where: {
          ownerId: 42,
          status: ClientStatus.ACTIVE,
        },
      },
    );

    expect(prisma.client.count).toHaveBeenNthCalledWith(
      4,
      {
        where: {
          ownerId: 42,
          status: ClientStatus.INACTIVE,
        },
      },
    );
  });

  it('should query task statistics only for the current user', async () => {
    prisma.client.count.mockResolvedValue(0);
    prisma.task.count.mockResolvedValue(0);
    prisma.activity.findMany.mockResolvedValue([]);

    await service.getDashboard(42);

    expect(prisma.task.count).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          ownerId: 42,
        },
      },
    );

    expect(prisma.task.count).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          ownerId: 42,
          status: TaskStatus.TODO,
        },
      },
    );

    expect(prisma.task.count).toHaveBeenNthCalledWith(
      3,
      {
        where: {
          ownerId: 42,
          status: TaskStatus.IN_PROGRESS,
        },
      },
    );

    expect(prisma.task.count).toHaveBeenNthCalledWith(
      4,
      {
        where: {
          ownerId: 42,
          status: TaskStatus.DONE,
        },
      },
    );

    expect(prisma.task.count).toHaveBeenNthCalledWith(
      5,
      {
        where: {
          ownerId: 42,
          priority: TaskPriority.HIGH,
        },
      },
    );
  });

  it('should return only the latest 10 activities', async () => {
    prisma.client.count.mockResolvedValue(0);
    prisma.task.count.mockResolvedValue(0);
    prisma.activity.findMany.mockResolvedValue([]);

    await service.getDashboard(42);

    expect(
      prisma.activity.findMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: 42,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  });
});