import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DeepMockProxy,
  mockDeep,
} from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();

    service = new UsersService(prisma);
  });

  describe('findById', () => {
    it('should return a user without the password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findById(1);

      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          email: 'user@clientflow.com',
          name: 'Test User',
          role: 'USER',
        }),
      );

      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a user with a hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        email: 'user@clientflow.com',
        password: 'Senha123',
        name: 'Test User',
      });

      expect(prisma.user.create).toHaveBeenCalled();

      const createCall = prisma.user.create.mock.calls[0][0];

      expect(createCall.data.email).toBe('user@clientflow.com');
      expect(createCall.data.name).toBe('Test User');
      expect(createCall.data.password).not.toBe('Senha123');

      expect(
        await bcrypt.compare(
          'Senha123',
          createCall.data.password,
        ),
      ).toBe(true);

      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'hashed-password',
        name: 'Existing User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.create({
          email: 'user@clientflow.com',
          password: 'Senha123',
          name: 'New User',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.user.delete.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.remove(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual({
        message: 'User deleted successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 1,
          email: 'admin@clientflow.local',
          password: 'hashed-password',
          name: 'Admin',
          role: 'ADMIN',
          refreshTokenHash: null,
          refreshTokenExp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          email: 'user@clientflow.com',
          password: 'hashed-password',
          name: 'User',
          role: 'USER',
          refreshTokenHash: null,
          refreshTokenExp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          id: 'asc',
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
      expect(result[0].email).toBe('admin@clientflow.local');
      expect(result[1].email).toBe('user@clientflow.com');
    });
  });

  describe('update', () => {
    it('should update user data successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'old-hashed-password',
        name: 'Old Name',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.user.update.mockResolvedValue({
        id: 1,
        email: 'new@clientflow.com',
        password: 'old-hashed-password',
        name: 'New Name',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update(1, {
        email: 'new@clientflow.com',
        name: 'New Name',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          email: 'new@clientflow.com',
          name: 'New Name',
        },
      });

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('new@clientflow.com');
      expect(result.name).toBe('New Name');
    });

    it('should hash a new password when updating password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'old-hashed-password',
        name: 'User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.user.update.mockResolvedValue({
        id: 1,
        email: 'user@clientflow.com',
        password: 'new-hashed-password',
        name: 'User',
        role: 'USER',
        refreshTokenHash: null,
        refreshTokenExp: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update(1, {
        password: 'NovaSenha123',
      });

      const updateCall = prisma.user.update.mock.calls[0][0];

      expect(updateCall.data.password).not.toBe('NovaSenha123');

      expect(updateCall.data.password).toEqual(expect.any(String));

      if (typeof updateCall.data.password !== 'string') {
        throw new Error('Expected password to be a string');
      }

      expect(
        await bcrypt.compare(
          'NovaSenha123',
          updateCall.data.password,
        ),
      ).toBe(true);
    });

    it('should throw ConflictException when new email already exists', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: 1,
          email: 'user@clientflow.com',
          password: 'hashed-password',
          name: 'User',
          role: 'USER',
          refreshTokenHash: null,
          refreshTokenExp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 2,
          email: 'other@clientflow.com',
          password: 'hashed-password',
          name: 'Other User',
          role: 'USER',
          refreshTokenHash: null,
          refreshTokenExp: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await expect(
        service.update(1, {
          email: 'other@clientflow.com',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          name: 'New Name',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('remove error cases', () => {
    it('should throw NotFoundException when deleting a nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(999),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});