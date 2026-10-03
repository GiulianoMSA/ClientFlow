import { Logger } from '@nestjs/common';
import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

import { HttpLoggerMiddleware } from './http-logger.middleware';

describe('HttpLoggerMiddleware', () => {
  let middleware: HttpLoggerMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new HttpLoggerMiddleware();
    next = jest.fn();
  });

  function createResponse(statusCode: number) {
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
    };

    response.statusCode = statusCode;

    return response;
  }

  it('should call next()', () => {
    const request = {
      method: 'GET',
      originalUrl: '/test',
    };

    const response = createResponse(200);

    middleware.use(
      request as never,
      response as never,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('should log successful requests as log', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const request = {
      method: 'GET',
      originalUrl: '/users',
    };

    const response = createResponse(200);

    middleware.use(
      request as never,
      response as never,
      next,
    );

    response.emit('finish');

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^GET \/users - 200 - \d+ms$/,
      ),
    );

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should log 4xx requests as warn', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const request = {
      method: 'GET',
      originalUrl: '/users/999',
    };

    const response = createResponse(404);

    middleware.use(
      request as never,
      response as never,
      next,
    );

    response.emit('finish');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^GET \/users\/999 - 404 - \d+ms$/,
      ),
    );

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should log 5xx requests as error', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const request = {
      method: 'POST',
      originalUrl: '/users',
    };

    const response = createResponse(500);

    middleware.use(
      request as never,
      response as never,
      next,
    );

    response.emit('finish');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /^POST \/users - 500 - \d+ms$/,
      ),
    );

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});