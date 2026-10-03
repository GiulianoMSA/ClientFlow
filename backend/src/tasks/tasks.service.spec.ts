import { NotFoundException } from '@nestjs/common';
import {
  DeepMockProxy,
  mockDeep,
} from 'jest-mock-extended';
import { jest } from '@jest/globals';

import { ActivityType } from '../generated/prisma/client';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { FindTasksDto } from './dto/find-tasks.dto';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: DeepMockProxy<PrismaService>;
  let activitiesService: {
    create: jest.Mock;
  };

  const task = {
    id: 1,
    title: 'Implementar dashboard',
    description: 'Criar dashboard principal do ClientFlow',
    status: 'TODO' as const,
    priority: 'HIGH' as const,
    dueDate: new Date('2026-10-01T00:00:00.000Z'),
    ownerId: 1,
    clientId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: {
      id: 10,
      name: 'João da Silva',
      company: 'Tech Solutions',
      email: 'joao@techsolutions.com',
      phone: '+55 61 99999-9999',
      status: 'LEAD' as const,
      ownerId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();

    activitiesService = {
      create: jest.fn(),
    };

    service = new TasksService(
      prisma,
      activitiesService as unknown as ActivitiesService,
    );
  });

  describe('findAll', () => {
    const task = {
      id: 1,
      title: 'Build ClientFlow dashboard',
      description: 'Create the initial dashboard',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      dueDate: new Date('2026-09-20T00:00:00.000Z'),
      ownerId: 1,
      clientId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: null,
    };

    it('should return paginated tasks belonging to the user', async () => {
      prisma.task.findMany.mockResolvedValue([
        task,
      ]);

      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(1, query);

      expect(result).toEqual({
        data: [task],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
      });
    });

    it('should return an empty page when the user has no tasks', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(1, query);

      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it('should calculate skip correctly for later pages', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(25);

      const query: FindTasksDto = {
        page: 3,
        limit: 10,
      };

      const result = await service.findAll(1, query);

      expect(result).toEqual({
        data: [],
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 20,
        take: 10,
      });
    });

    it('should filter tasks by status', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
        status: 'TODO',
      };

      await service.findAll(1, query);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'TODO',
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'TODO',
        },
      });
    });

    it('should filter tasks by priority', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
        priority: 'HIGH',
      };

      await service.findAll(1, query);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          priority: 'HIGH',
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          priority: 'HIGH',
        },
      });
    });

    it('should search tasks by title or description', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
        search: 'dashboard',
      };

      await service.findAll(1, query);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          OR: [
            {
              title: {
                contains: 'dashboard',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'dashboard',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should filter tasks by due date range', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 1,
        limit: 10,
        dueDateFrom: '2026-09-01T00:00:00.000Z',
        dueDateTo: '2026-09-30T23:59:59.999Z',
      };

      await service.findAll(1, query);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          dueDate: {
            gte: new Date(
              '2026-09-01T00:00:00.000Z',
            ),
            lte: new Date(
              '2026-09-30T23:59:59.999Z',
            ),
          },
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          dueDate: {
            gte: new Date(
              '2026-09-01T00:00:00.000Z',
            ),
            lte: new Date(
              '2026-09-30T23:59:59.999Z',
            ),
          },
        },
      });
    });

    it('should combine status, priority, search, and pagination', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      const query: FindTasksDto = {
        page: 2,
        limit: 5,
        status: 'TODO',
        priority: 'HIGH',
        search: 'dashboard',
      };

      const result = await service.findAll(1, query);

      expect(result).toEqual({
        data: [task],
        page: 2,
        limit: 5,
        total: 1,
        totalPages: 1,
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'TODO',
          priority: 'HIGH',
          OR: [
            {
              title: {
                contains: 'dashboard',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'dashboard',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          client: true,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 5,
        take: 5,
      });
    });
  });

  describe('findById', () => {
    it('should return a task belonging to the user', async () => {
      prisma.task.findFirst.mockResolvedValue(task);

      const result = await service.findById(1, 1);

      expect(result).toEqual(task);

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(999, 1),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 999,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });
    });

    it('should throw NotFoundException when task belongs to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(1, 2),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 2,
        },
        include: {
          client: true,
        },
      });
    });
  });

  describe('create', () => {
    it('should create a task owned by the current user', async () => {
      const data = {
        title: 'Implementar dashboard',
        description: 'Criar dashboard principal do ClientFlow',
        status: 'TODO' as const,
        priority: 'HIGH' as const,
        dueDate: '2026-10-01T00:00:00.000Z',
        clientId: 10,
      };

      prisma.client.findFirst.mockResolvedValue(
        task.client,
      );

      prisma.task.create.mockResolvedValue(task);

      const result = await service.create(1, data);

      expect(result).toEqual(task);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 10,
          ownerId: 1,
        },
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Implementar dashboard',
          description:
            'Criar dashboard principal do ClientFlow',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(
            '2026-10-01T00:00:00.000Z',
          ),
          clientId: 10,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_CREATED,
        'Task "Implementar dashboard" created.',
      );
    });

    it('should create a task without a client', async () => {
      const data = {
        title: 'Tarefa sem cliente',
      };

      const createdTask = {
        ...task,
        id: 2,
        title: 'Tarefa sem cliente',
        description: null,
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        dueDate: null,
        clientId: null,
        client: null,
      };

      prisma.task.create.mockResolvedValue(
        createdTask,
      );

      const result = await service.create(1, data);

      expect(result).toEqual(createdTask);

      expect(prisma.client.findFirst).not.toHaveBeenCalled();

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Tarefa sem cliente',
          description: undefined,
          status: undefined,
          priority: undefined,
          dueDate: undefined,
          clientId: undefined,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_CREATED,
        'Task "Tarefa sem cliente" created.',
      );
    });

    it('should not create a task for a client belonging to another user', async () => {
      const data = {
        title: 'Tarefa inválida',
        clientId: 999,
      };

      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.create(1, data),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.create).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task belonging to the user', async () => {
      const data = {
        title: 'Dashboard atualizado',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
      };

      const updatedTask = {
        ...task,
        title: 'Dashboard atualizado',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
      };

      prisma.task.findFirst.mockResolvedValue(task);

      prisma.task.update.mockResolvedValue(
        updatedTask,
      );

      const result = await service.update(
        1,
        1,
        data,
      );

      expect(result).toEqual(updatedTask);

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: 'Dashboard atualizado',
          description: undefined,
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: undefined,
          clientId: undefined,
        },
        include: {
          client: true,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_UPDATED,
        'Task "Dashboard atualizado" updated.',
      );
    });

    it('should validate client ownership when assigning a client', async () => {
      const data = {
        clientId: 20,
      };

      const updatedTask = {
        ...task,
        clientId: 20,
      };

      prisma.task.findFirst.mockResolvedValue(task);

      prisma.client.findFirst.mockResolvedValue(
        task.client,
      );

      prisma.task.update.mockResolvedValue(
        updatedTask,
      );

      const result = await service.update(
        1,
        1,
        data,
      );

      expect(result).toEqual(updatedTask);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 20,
          ownerId: 1,
        },
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: undefined,
          description: undefined,
          status: undefined,
          priority: undefined,
          dueDate: undefined,
          clientId: 20,
        },
        include: {
          client: true,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_UPDATED,
        'Task "Implementar dashboard" updated.',
      );
    });

    it('should allow removing the client from a task', async () => {
      const data = {
        clientId: null,
      };

      const updatedTask = {
        ...task,
        clientId: null,
        client: null,
      };

      prisma.task.findFirst.mockResolvedValue(task);

      prisma.task.update.mockResolvedValue(
        updatedTask,
      );

      const result = await service.update(
        1,
        1,
        data,
      );

      expect(result).toEqual(updatedTask);

      expect(prisma.client.findFirst).not.toHaveBeenCalled();

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: undefined,
          description: undefined,
          status: undefined,
          priority: undefined,
          dueDate: undefined,
          clientId: null,
        },
        include: {
          client: true,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_UPDATED,
        'Task "Implementar dashboard" updated.',
      );
    });

    it('should not update a task belonging to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update(1, 2, {
          title: 'Tentativa de alteração',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.update).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent task', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, 1, {
          title: 'Tarefa inexistente',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.update).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });

    it('should not update when the assigned client belongs to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(task);

      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.update(1, 1, {
          clientId: 999,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.update).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a task belonging to the user', async () => {
      prisma.task.findFirst.mockResolvedValue(task);

      prisma.task.delete.mockResolvedValue(task);

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Task deleted successfully',
      });

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
        include: {
          client: true,
        },
      });

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.TASK_DELETED,
        'Task "Implementar dashboard" deleted.',
      );
    });

    it('should not delete a task belonging to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(1, 2),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.delete).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting a nonexistent task', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(999, 1),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.task.delete).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });
  });
});