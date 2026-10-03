import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaService } from '../prisma/prisma.service';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();

    service = new AppService(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the API status with the user count', async () => {
    prisma.user.count.mockResolvedValue(5);

    const result = await service.getHello();

    expect(result).toBe(
      'ClientFlow API is running! Users: 5',
    );

    expect(prisma.user.count).toHaveBeenCalled();
  });
});