import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { jest } from '@jest/globals';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;

  let usersService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [UsersController],
        providers: [
          {
            provide: UsersService,
            useValue: usersService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

    controller = module.get<UsersController>(
      UsersController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users', async () => {
    const users = [
      {
        id: 1,
        email: 'admin@clientflow.local',
        name: 'Admin',
        role: 'ADMIN',
      },
    ];

    usersService.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(result).toEqual(users);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('should find a user by id', async () => {
    const user = {
      id: 1,
      email: 'user@clientflow.com',
      name: 'User',
      role: 'USER',
    };

    usersService.findById.mockResolvedValue(user);

    const result = await controller.findById(1);

    expect(result).toEqual(user);
    expect(usersService.findById).toHaveBeenCalledWith(1);
  });

  it('should create a user', async () => {
    const dto = {
      email: 'new@clientflow.com',
      password: 'Senha123',
      name: 'New User',
    };

    const createdUser = {
      id: 5,
      email: dto.email,
      name: dto.name,
      role: 'USER',
    };

    usersService.create.mockResolvedValue(createdUser);

    const result = await controller.create(dto);

    expect(result).toEqual(createdUser);
    expect(usersService.create).toHaveBeenCalledWith(dto);
  });

  it('should update a user', async () => {
    const dto = {
      name: 'Updated User',
    };

    const updatedUser = {
      id: 1,
      email: 'user@clientflow.com',
      name: 'Updated User',
      role: 'USER',
    };

    usersService.update.mockResolvedValue(updatedUser);

    const result = await controller.update(1, dto);

    expect(result).toEqual(updatedUser);

    expect(usersService.update).toHaveBeenCalledWith(
      1,
      dto,
    );
  });

  it('should remove a user', async () => {
    usersService.remove.mockResolvedValue({
      message: 'User deleted successfully',
    });

    const result = await controller.remove(1);

    expect(result).toEqual({
      message: 'User deleted successfully',
    });

    expect(usersService.remove).toHaveBeenCalledWith(1);
  });
});