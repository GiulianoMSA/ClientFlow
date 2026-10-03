import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { jest } from '@jest/globals';

import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };

  let request: {
    method: string;
    url: string;
  };

  let host: ExecutionContext;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    request = {
      method: 'GET',
      url: '/test',
    };

    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  });

  it('should handle BadRequestException', () => {
    filter.catch(
      new BadRequestException('Invalid request'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid request',
        error: 'Bad Request',
        path: '/test',
      }),
    );
  });

  it('should handle UnauthorizedException', () => {
    filter.catch(
      new UnauthorizedException('Invalid credentials'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(401);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      }),
    );
  });

  it('should handle ForbiddenException', () => {
    filter.catch(
      new ForbiddenException('Insufficient permissions'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(403);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Insufficient permissions',
        error: 'Forbidden',
      }),
    );
  });

  it('should handle NotFoundException', () => {
    filter.catch(
      new NotFoundException('User not found'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(404);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      }),
    );
  });

  it('should handle ConflictException', () => {
    filter.catch(
      new ConflictException('Email already registered'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(409);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Email already registered',
        error: 'Conflict',
      }),
    );
  });

  it('should handle an unknown exception as 500', () => {
    filter.catch(
      new Error('Unexpected error'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(500);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/test',
      }),
    );
  });

  it('should include an ISO timestamp', () => {
    filter.catch(
      new InternalServerErrorException(),
      host,
    );

    const responseBody =
      response.json.mock.calls[0][0] as {
        timestamp: string;
      };

    expect(responseBody.timestamp).toBeDefined();
    expect(
      Number.isNaN(Date.parse(responseBody.timestamp)),
    ).toBe(false);
  });
});