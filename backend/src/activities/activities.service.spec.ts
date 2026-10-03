import { jest } from '@jest/globals';

import { ActivityType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const prisma = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ActivitiesService(prisma);
  });

  describe('create', () => {
    it('should create an activity', async () => {
      const activity = {
        id: 1,
        userId: 1,
        type: ActivityType.CLIENT_CREATED,
        message: 'Client "Client 1" created.',
      };

      prisma.activity.create = jest
        .fn()
        .mockResolvedValue(activity);

      await expect(
        service.create(
          1,
          ActivityType.CLIENT_CREATED,
          'Client "Client 1" created.',
        ),
      ).resolves.toEqual(activity);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: ActivityType.CLIENT_CREATED,
          message: 'Client "Client 1" created.',
        },
      });
    });

    it('should create a task activity', async () => {
      const activity = {
        id: 2,
        userId: 1,
        type: ActivityType.TASK_CREATED,
        message: 'Task "Task 1" created.',
      };

      prisma.activity.create = jest
        .fn()
        .mockResolvedValue(activity);

      await expect(
        service.create(
          1,
          ActivityType.TASK_CREATED,
          'Task "Task 1" created.',
        ),
      ).resolves.toEqual(activity);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: ActivityType.TASK_CREATED,
          message: 'Task "Task 1" created.',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return only the current user activities', async () => {
      const activities = [
        {
          id: 2,
          userId: 1,
          type: ActivityType.TASK_CREATED,
          message: 'Task "Task 1" created.',
        },
        {
          id: 1,
          userId: 1,
          type: ActivityType.CLIENT_CREATED,
          message: 'Client "Client 1" created.',
        },
      ];

      prisma.activity.findMany = jest
        .fn()
        .mockResolvedValue(activities);

      await expect(
        service.findAll(1),
      ).resolves.toEqual(activities);

      expect(
        prisma.activity.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 1,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});