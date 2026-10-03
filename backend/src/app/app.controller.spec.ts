import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: {
    getHello: jest.Mock;
  };

  beforeEach(async () => {
    appService = {
      getHello: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the API status from AppService', async () => {
    appService.getHello.mockResolvedValue(
      'ClientFlow API is running! Users: 5',
    );

    const result = await controller.getHello();

    expect(result).toBe(
      'ClientFlow API is running! Users: 5',
    );

    expect(appService.getHello).toHaveBeenCalled();
  });
});