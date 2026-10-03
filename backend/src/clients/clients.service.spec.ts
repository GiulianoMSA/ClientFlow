import { NotFoundException } from '@nestjs/common';
import {
  DeepMockProxy,
  mockDeep,
} from 'jest-mock-extended';
import { jest } from '@jest/globals';

import { ActivityType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ClientsService } from './clients.service';
import { FindClientsDto } from './dto/find-clients.dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: DeepMockProxy<PrismaService>;
  let activitiesService: {
    create: jest.Mock;
  };

  const client = {
    id: 1,
    name: 'João da Silva',
    company: 'Tech Solutions',
    email: 'joao@techsolutions.com',
    phone: '+55 61 99999-9999',
    status: 'LEAD' as const,
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();

    activitiesService = {
      create: jest.fn(),
    };

    service = new ClientsService(
      prisma,
      activitiesService as unknown as ActivitiesService,
    );
  });

  describe('findAll', () => {
    it('should return paginated clients belonging to the user', async () => {
      prisma.client.findMany.mockResolvedValue([
        client,
      ]);

      prisma.client.count.mockResolvedValue(1);

      const query: FindClientsDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(1, query);

      expect(result).toEqual({
        data: [client],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
      });
    });

    it('should return an empty page when the user has no clients', async () => {
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(0);

      const query: FindClientsDto = {
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

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
      });
    });

    it('should calculate skip correctly for later pages', async () => {
      prisma.client.findMany.mockResolvedValue([]);
      prisma.client.count.mockResolvedValue(25);

      const query: FindClientsDto = {
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

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
        },
        orderBy: {
          id: 'asc',
        },
        skip: 20,
        take: 10,
      });
    });

    it('should filter clients by status', async () => {
      prisma.client.findMany.mockResolvedValue([
        {
          ...client,
          status: 'ACTIVE' as const,
        },
      ]);

      prisma.client.count.mockResolvedValue(1);

      const query: FindClientsDto = {
        page: 1,
        limit: 10,
        status: 'ACTIVE',
      };

      const result = await service.findAll(1, query);

      expect(result.data).toHaveLength(1);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'ACTIVE',
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'ACTIVE',
        },
      });
    });

    it('should search clients by name, company, or email', async () => {
      prisma.client.findMany.mockResolvedValue([
        client,
      ]);

      prisma.client.count.mockResolvedValue(1);

      const query: FindClientsDto = {
        page: 1,
        limit: 10,
        search: 'tech',
      };

      await service.findAll(1, query);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          OR: [
            {
              name: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: {
          id: 'asc',
        },
        skip: 0,
        take: 10,
      });

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          OR: [
            {
              name: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
          ],
        },
      });
    });

    it('should combine status and search filters', async () => {
      prisma.client.findMany.mockResolvedValue([
        {
          ...client,
          status: 'ACTIVE' as const,
        },
      ]);

      prisma.client.count.mockResolvedValue(1);

      const query: FindClientsDto = {
        page: 2,
        limit: 5,
        status: 'ACTIVE',
        search: 'tech',
      };

      await service.findAll(1, query);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 1,
          status: 'ACTIVE',
          OR: [
            {
              name: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              company: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: 'tech',
                mode: 'insensitive',
              },
            },
          ],
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
    it('should return a client belonging to the user', async () => {
      prisma.client.findFirst.mockResolvedValue(client);

      const result = await service.findById(1, 1);

      expect(result).toEqual(client);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
      });
    });

    it('should throw NotFoundException when client does not exist', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(999, 1),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 999,
          ownerId: 1,
        },
      });
    });

    it('should throw NotFoundException when client belongs to another user', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(1, 2),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 2,
        },
      });
    });
  });

  describe('create', () => {
    it('should create a client owned by the current user', async () => {
      const data = {
        name: 'João da Silva',
        company: 'Tech Solutions',
        email: 'joao@techsolutions.com',
        phone: '+55 61 99999-9999',
      };

      prisma.client.create.mockResolvedValue(client);

      const result = await service.create(1, data);

      expect(result).toEqual(client);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'João da Silva',
          company: 'Tech Solutions',
          email: 'joao@techsolutions.com',
          phone: '+55 61 99999-9999',
          ownerId: 1,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.CLIENT_CREATED,
        'Client "João da Silva" created.',
      );
    });

    it('should create a client with optional fields omitted', async () => {
      const data = {
        name: 'Maria Silva',
      };

      const createdClient = {
        ...client,
        id: 2,
        name: 'Maria Silva',
        company: null,
        email: null,
        phone: null,
        ownerId: 1,
      };

      prisma.client.create.mockResolvedValue(
        createdClient,
      );

      const result = await service.create(1, data);

      expect(result).toEqual(createdClient);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'Maria Silva',
          company: undefined,
          email: undefined,
          phone: undefined,
          ownerId: 1,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.CLIENT_CREATED,
        'Client "Maria Silva" created.',
      );
    });
  });

  describe('update', () => {
    it('should update a client belonging to the user', async () => {
      const data = {
        name: 'João Atualizado',
        status: 'ACTIVE' as const,
      };

      const updatedClient = {
        ...client,
        name: 'João Atualizado',
        status: 'ACTIVE' as const,
      };

      prisma.client.findFirst.mockResolvedValue(client);
      prisma.client.update.mockResolvedValue(
        updatedClient,
      );

      const result = await service.update(1, 1, data);

      expect(result).toEqual(updatedClient);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
      });

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data,
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.CLIENT_UPDATED,
        'Client "João Atualizado" updated.',
      );
    });

    it('should not update a client belonging to another user', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.update(1, 2, {
          name: 'Tentativa de alteração',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.update).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent client', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.update(999, 1, {
          name: 'Cliente inexistente',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.update).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a client belonging to the user', async () => {
      prisma.client.findFirst.mockResolvedValue(client);
      prisma.client.delete.mockResolvedValue(client);

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Client deleted successfully',
      });

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          ownerId: 1,
        },
      });

      expect(prisma.client.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(
        activitiesService.create,
      ).toHaveBeenCalledWith(
        1,
        ActivityType.CLIENT_DELETED,
        'Client "João da Silva" deleted',
      );
    });

    it('should not delete a client belonging to another user', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(1, 2),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.delete).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting a nonexistent client', async () => {
      prisma.client.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(999, 1),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.client.delete).not.toHaveBeenCalled();

      expect(
        activitiesService.create,
      ).not.toHaveBeenCalled();
    });
  });
});