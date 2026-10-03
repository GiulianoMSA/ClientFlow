import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AppModule } from './app/app.module';
import { PrismaService } from './prisma/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  ActivityType,
  UserRole,
} from './generated/prisma/client';

describe('ClientFlow API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: 'e2e-user@clientflow.local',
    password: 'TestPassword123',
    name: 'E2E Test User',
  };

  const adminUser = {
    email: 'e2e-admin@clientflow.local',
    password: 'AdminPassword123',
    name: 'E2E Admin User',
  };

  let userId: number;
  let adminId: number;

  let userAccessToken: string;
  let userRefreshToken: string;

  let adminAccessToken: string;
  let adminRefreshToken: string;

  let userClientId: number;
  let adminClientId: number;
  let userTaskId: number;
  let secondUserTaskId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    prisma = app.get(PrismaService);

    await app.init();

    const hashedUserPassword = await bcrypt.hash(
      testUser.password,
      10,
    );

    const hashedAdminPassword = await bcrypt.hash(
      adminUser.password,
      10,
    );

    const user = await prisma.user.upsert({
      where: {
        email: testUser.email,
      },
      update: {
        password: hashedUserPassword,
        name: testUser.name,
        role: UserRole.USER,
        refreshTokenHash: null,
        refreshTokenExp: null,
      },
      create: {
        email: testUser.email,
        password: hashedUserPassword,
        name: testUser.name,
        role: UserRole.USER,
      },
    });

    const admin = await prisma.user.upsert({
      where: {
        email: adminUser.email,
      },
      update: {
        password: hashedAdminPassword,
        name: adminUser.name,
        role: UserRole.ADMIN,
        refreshTokenHash: null,
        refreshTokenExp: null,
      },
      create: {
        email: adminUser.email,
        password: hashedAdminPassword,
        name: adminUser.name,
        role: UserRole.ADMIN,
      },
    });

    userId = user.id;
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [userId, adminId],
        },
      },
    });

    await app.close();
  });

  describe('Authentication', () => {
    it('should login a USER and return access and refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );

      userAccessToken = response.body.accessToken;
      userRefreshToken = response.body.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should return the authenticated USER with /auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          sub: userId,
          email: testUser.email,
          role: UserRole.USER,
        }),
      );
    });

    it('should reject /auth/me without a token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Authorization / RBAC', () => {
    it('should login an ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .expect(201);

      adminAccessToken = response.body.accessToken;
      adminRefreshToken = response.body.refreshToken;

      expect(adminAccessToken).toEqual(expect.any(String));
      expect(adminRefreshToken).toEqual(expect.any(String));
    });

    it('should reject USER access to GET /users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(403);
    });

    it('should allow ADMIN access to GET /users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: testUser.email,
          }),
          expect.objectContaining({
            email: adminUser.email,
          }),
        ]),
      );
    });
  });

  describe('Refresh token', () => {
    it('should refresh the USER access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: userRefreshToken,
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      );

      expect(response.body.refreshToken).not.toBe(
        userRefreshToken,
      );

      userAccessToken = response.body.accessToken;
      userRefreshToken = response.body.refreshToken;
    });

    it('should reject the previous USER refresh token after rotation', async () => {
      const oldRefreshToken = userRefreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefreshToken,
        })
        .expect(201);

      userRefreshToken = response.body.refreshToken;
      userAccessToken = response.body.accessToken;

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefreshToken,
        })
        .expect(401);
    });
  });

  describe('Clients', () => {
    it('should allow USER to create a client', async () => {
      const response = await request(app.getHttpServer())
        .post('/clients')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .send({
          name: 'User Client',
          company: 'User Company',
          email: 'client-user@example.com',
          phone: '+55 61 99999-0001',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'User Client',
          company: 'User Company',
          email: 'client-user@example.com',
          phone: '+55 61 99999-0001',
          ownerId: userId,
        }),
      );

      userClientId = response.body.id;
    });

    it('should allow USER to list only their own clients', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userClientId,
            ownerId: userId,
            name: 'User Client',
          }),
        ]),
      );

      expect(
        response.body.data.every(
          (client: { ownerId: number }) =>
            client.ownerId === userId,
        ),
      ).toBe(true);
    });

    it('should allow USER to get their own client', async () => {
      const response = await request(app.getHttpServer())
        .get(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: userClientId,
          ownerId: userId,
          name: 'User Client',
        }),
      );
    });

    it('should allow USER to update their own client', async () => {
      const response = await request(app.getHttpServer())
        .put(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .send({
          name: 'Updated User Client',
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: userClientId,
          ownerId: userId,
          name: 'Updated User Client',
          status: 'ACTIVE',
        }),
      );
    });

    it('should reject ADMIN access to USER client', async () => {
      await request(app.getHttpServer())
        .get(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(404);
    });

    it('should reject ADMIN from updating USER client', async () => {
      await request(app.getHttpServer())
        .put(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .send({
          name: 'Should Not Update',
        })
        .expect(404);
    });

    it('should reject ADMIN from deleting USER client', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(404);
    });

    it('should allow ADMIN to create their own client', async () => {
      const response = await request(app.getHttpServer())
        .post('/clients')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .send({
          name: 'Admin Client',
          company: 'Admin Company',
          email: 'client-admin@example.com',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'Admin Client',
          company: 'Admin Company',
          email: 'client-admin@example.com',
          ownerId: adminId,
        }),
      );

      adminClientId = response.body.id;
    });

    it('should allow ADMIN to see only their own clients', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: adminClientId,
            ownerId: adminId,
            name: 'Admin Client',
          }),
        ]),
      );

      expect(
        response.body.data.every(
          (client: { ownerId: number }) =>
            client.ownerId === adminId,
        ),
      ).toBe(true);

      expect(
        response.body.data.some(
          (client: { id: number }) =>
            client.id === userClientId,
        ),
      ).toBe(false);
    });

    it('should allow ADMIN to get their own client', async () => {
      const response = await request(app.getHttpServer())
        .get(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: adminClientId,
          ownerId: adminId,
          name: 'Admin Client',
        }),
      );
    });

    it('should allow ADMIN to update their own client', async () => {
      const response = await request(app.getHttpServer())
        .put(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .send({
          name: 'Updated Admin Client',
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: adminClientId,
          ownerId: adminId,
          name: 'Updated Admin Client',
          status: 'ACTIVE',
        }),
      );
    });

    it('should paginate clients', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?page=1&limit=1')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          page: 1,
          limit: 1,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should filter clients by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?status=ACTIVE')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);

      expect(
        response.body.data.every(
          (client: { status: string }) =>
            client.status === 'ACTIVE',
        ),
      ).toBe(true);
    });

    it('should search clients by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?search=Updated%20User')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userClientId,
            name: 'Updated User Client',
          }),
        ]),
      );
    });

    it('should combine pagination, status, and search filters', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/clients?page=1&limit=1&status=ACTIVE&search=Updated',
        )
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userClientId,
            name: 'Updated User Client',
            status: 'ACTIVE',
          }),
        ]),
      );
    });

    it('should reject an invalid clients page', async () => {
      await request(app.getHttpServer())
        .get('/clients?page=0')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject a clients limit greater than 100', async () => {
      await request(app.getHttpServer())
        .get('/clients?limit=101')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject an invalid client status', async () => {
      await request(app.getHttpServer())
        .get('/clients?status=INVALID')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject USER from accessing ADMIN client', async () => {
      await request(app.getHttpServer())
        .get(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(404);
    });

    it('should reject USER from updating ADMIN client', async () => {
      await request(app.getHttpServer())
        .put(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .send({
          name: 'Should Not Update',
        })
        .expect(404);
    });

    it('should reject USER from deleting ADMIN client', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(404);
    });

    it('should allow USER to delete their own client', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      await request(app.getHttpServer())
        .get(`/clients/${userClientId}`)
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(404);
    });

    it('should allow ADMIN to delete their own client', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      await request(app.getHttpServer())
        .get(`/clients/${adminClientId}`)
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(404);
    });

    it('should reject unauthenticated access to clients', async () => {
      await request(app.getHttpServer())
        .get('/clients')
        .expect(401);

      await request(app.getHttpServer())
        .post('/clients')
        .send({
          name: 'Unauthorized Client',
        })
        .expect(401);
    });
  });

  describe('Tasks', () => {
    it('should allow USER to create a task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .send({
          title: 'Build ClientFlow dashboard',
          description: 'Create the initial dashboard',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: '2026-09-20T00:00:00.000Z',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          title: 'Build ClientFlow dashboard',
          description: 'Create the initial dashboard',
          status: 'TODO',
          priority: 'HIGH',
          ownerId: userId,
        }),
      );

      userTaskId = response.body.id;
    });

    it('should allow USER to create a second task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .send({
          title: 'Fix login page',
          description: 'Review authentication form',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: '2026-10-10T00:00:00.000Z',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          title: 'Fix login page',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          ownerId: userId,
        }),
      );

      secondUserTaskId = response.body.id;
    });

    it('should allow USER to list their own tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userTaskId,
            ownerId: userId,
          }),
          expect.objectContaining({
            id: secondUserTaskId,
            ownerId: userId,
          }),
        ]),
      );

      expect(
        response.body.data.every(
          (task: { ownerId: number }) =>
            task.ownerId === userId,
        ),
      ).toBe(true);
    });

    it('should paginate tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?page=1&limit=1')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?status=IN_PROGRESS')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: secondUserTaskId,
            status: 'IN_PROGRESS',
          }),
        ]),
      );

      expect(
        response.body.data.every(
          (task: { status: string }) =>
            task.status === 'IN_PROGRESS',
        ),
      ).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?priority=HIGH')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userTaskId,
            priority: 'HIGH',
          }),
        ]),
      );

      expect(
        response.body.data.every(
          (task: { priority: string }) =>
            task.priority === 'HIGH',
        ),
      ).toBe(true);
    });

    it('should search tasks by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?search=dashboard')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userTaskId,
            title: 'Build ClientFlow dashboard',
          }),
        ]),
      );
    });

    it('should search tasks by description', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks?search=authentication')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: secondUserTaskId,
            description: 'Review authentication form',
          }),
        ]),
      );
    });

    it('should filter tasks by due date range', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/tasks?dueDateFrom=2026-09-01T00:00:00.000Z&dueDateTo=2026-09-30T23:59:59.999Z',
        )
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userTaskId,
          }),
        ]),
      );

      expect(
        response.body.data.some(
          (task: { id: number }) =>
            task.id === secondUserTaskId,
        ),
      ).toBe(false);
    });

    it('should combine pagination, status, priority, and search', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/tasks?page=1&limit=10&status=TODO&priority=HIGH&search=dashboard',
        )
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: userTaskId,
            title: 'Build ClientFlow dashboard',
            status: 'TODO',
            priority: 'HIGH',
          }),
        ]),
      );
    });

    it('should reject invalid page', async () => {
      await request(app.getHttpServer())
        .get('/tasks?page=0')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject invalid limit', async () => {
      await request(app.getHttpServer())
        .get('/tasks?limit=101')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject invalid status', async () => {
      await request(app.getHttpServer())
        .get('/tasks?status=INVALID')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject invalid priority', async () => {
      await request(app.getHttpServer())
        .get('/tasks?priority=INVALID')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(400);
    });

    it('should reject unauthenticated access to tasks', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });
  });

  describe('Dashboard', () => {
    it('should return the USER dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          clients: expect.objectContaining({
            total: expect.any(Number),
            lead: expect.any(Number),
            active: expect.any(Number),
            inactive: expect.any(Number),
          }),

          tasks: expect.objectContaining({
            total: expect.any(Number),
            todo: expect.any(Number),
            inProgress: expect.any(Number),
            done: expect.any(Number),
            highPriority: expect.any(Number),
            overdue: expect.any(Number),
          }),

          recentActivities: expect.any(Array),
        }),
      );
    });

    it('should return USER-specific dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(
        response.body.recentActivities.every(
          (activity: { userId: number }) =>
            activity.userId === userId,
        ),
      ).toBe(true);
    });

    it('should allow ADMIN to access their dashboard', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          clients: expect.any(Object),
          tasks: expect.any(Object),
          recentActivities: expect.any(Array),
        }),
      );
    });

    it('should reject unauthenticated dashboard access', async () => {
      await request(app.getHttpServer())
        .get('/dashboard')
        .expect(401);
    });
  });

  describe('Activities', () => {
    it('should allow USER to list their own activities', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.any(Array),
      );

      expect(response.body.length).toBeGreaterThan(0);

      expect(
        response.body.every(
          (activity: { userId: number }) =>
            activity.userId === userId,
        ),
      ).toBe(true);
    });

    it('should contain USER client activity history', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      const activityTypes = response.body.map(
        (activity: { type: ActivityType }) =>
          activity.type,
      );

      expect(activityTypes).toEqual(
        expect.arrayContaining([
          ActivityType.CLIENT_CREATED,
          ActivityType.CLIENT_UPDATED,
          ActivityType.CLIENT_DELETED,
        ]),
      );
    });

    it('should allow ADMIN to list their own activities', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(response.body).toEqual(
        expect.any(Array),
      );

      expect(response.body.length).toBeGreaterThan(0);

      expect(
        response.body.every(
          (activity: { userId: number }) =>
            activity.userId === adminId,
        ),
      ).toBe(true);
    });

    it('should contain ADMIN client activity history', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      const activityTypes = response.body.map(
        (activity: { type: ActivityType }) =>
          activity.type,
      );

      expect(activityTypes).toEqual(
        expect.arrayContaining([
          ActivityType.CLIENT_CREATED,
          ActivityType.CLIENT_UPDATED,
          ActivityType.CLIENT_DELETED,
        ]),
      );
    });

    it('should not expose USER activities to ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);

      expect(
        response.body.some(
          (activity: { userId: number }) =>
            activity.userId === userId,
        ),
      ).toBe(false);
    });

    it('should not expose ADMIN activities to USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/activities')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);

      expect(
        response.body.some(
          (activity: { userId: number }) =>
            activity.userId === adminId,
        ),
      ).toBe(false);
    });

    it('should reject unauthenticated access to activities', async () => {
      await request(app.getHttpServer())
        .get('/activities')
        .expect(401);
    });
  });

  describe('Logout', () => {
    it('should logout the USER', async () => {
      await request(app.getHttpServer())
        .delete('/auth/logout')
        .set(
          'Authorization',
          `Bearer ${userAccessToken}`,
        )
        .expect(200);
    });

    it('should reject the USER refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: userRefreshToken,
        })
        .expect(401);
    });

    it('should logout the ADMIN', async () => {
      await request(app.getHttpServer())
        .delete('/auth/logout')
        .set(
          'Authorization',
          `Bearer ${adminAccessToken}`,
        )
        .expect(200);
    });

    it('should reject the ADMIN refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: adminRefreshToken,
        })
        .expect(401);
    });
  });
});