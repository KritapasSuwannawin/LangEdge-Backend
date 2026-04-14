import { ArgumentsHost, BadRequestException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';

import { NotFoundAppError } from '@/domain/shared/errors/not-found-app-error';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { ApiErrorEnvelope } from '@/shared/infrastructure/http/contracts/api-error-envelope';
import { GlobalExceptionFilter } from '@/shared/infrastructure/http/filters/global-exception.filter';
import { logError, logWarn } from '@/shared/utils/systemUtils';

jest.mock('@/shared/utils/systemUtils', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

interface MockRequest {
  readonly method: string;
  readonly url: string;
}

type MockResponse = Record<string, never>;

interface MockHttpAdapter {
  readonly getRequestMethod: jest.Mock<string, [MockRequest]>;
  readonly getRequestUrl: jest.Mock<string, [MockRequest]>;
  readonly reply: jest.Mock<void, [MockResponse, ApiErrorEnvelope, number]>;
}

const createArgumentsHost = (request: MockRequest, response: MockResponse): ArgumentsHost => {
  return {
    getArgByIndex: () => undefined,
    getArgs: () => [request, response],
    getType: () => 'http',
    switchToHttp: () => ({
      getNext: () => undefined,
      getRequest: () => request,
      getResponse: () => response,
    }),
    switchToRpc: () => ({
      getContext: () => undefined,
      getData: () => undefined,
    }),
    switchToWs: () => ({
      getClient: () => undefined,
      getData: () => undefined,
      getPattern: () => '',
    }),
  } as unknown as ArgumentsHost;
};

const createSut = () => {
  const request: MockRequest = {
    method: 'GET',
    url: '/api/translation',
  };
  const response: MockResponse = {};
  const httpAdapter: MockHttpAdapter = {
    getRequestMethod: jest.fn().mockReturnValue(request.method),
    getRequestUrl: jest.fn().mockReturnValue(request.url),
    reply: jest.fn(),
  };
  const httpAdapterHost = { httpAdapter } as unknown as HttpAdapterHost;
  const filter = new GlobalExceptionFilter(httpAdapterHost);
  const host = createArgumentsHost(request, response);

  return {
    filter,
    host,
    httpAdapter,
    request,
    response,
  };
};

describe('GlobalExceptionFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize ValidationAppError to a 400 envelope and log a warning once', () => {
    const { filter, host, httpAdapter, response } = createSut();
    const exception = new ValidationAppError({
      details: [{ field: 'text', message: 'text must not be empty' }],
    });

    filter.catch(exception, host);

    expect(logWarn).toHaveBeenCalledTimes(1);
    expect(logWarn).toHaveBeenCalledWith('http.request.failure', 'text must not be empty', {
      errorCode: 'VALIDATION_ERROR',
      method: 'GET',
      path: '/api/translation',
      statusCode: HttpStatus.BAD_REQUEST,
    });
    expect(logError).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'text must not be empty',
          details: [{ field: 'text', message: 'text must not be empty' }],
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should normalize UnauthorizedException to a 401 envelope and log a warning once', () => {
    const { filter, host, httpAdapter, response } = createSut();

    filter.catch(new UnauthorizedException(), host);

    expect(logWarn).toHaveBeenCalledTimes(1);
    expect(logWarn).toHaveBeenCalledWith('http.request.failure', 'Unauthorized', {
      errorCode: 'UNAUTHORIZED',
      method: 'GET',
      path: '/api/translation',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
    expect(logError).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should normalize NotFoundAppError to a 404 envelope and log a warning once', () => {
    const { filter, host, httpAdapter, response } = createSut();

    filter.catch(new NotFoundAppError({ code: 'USER_NOT_FOUND', publicMessage: 'User not found' }), host);

    expect(logWarn).toHaveBeenCalledTimes(1);
    expect(logWarn).toHaveBeenCalledWith('http.request.failure', 'User not found', {
      errorCode: 'USER_NOT_FOUND',
      method: 'GET',
      path: '/api/translation',
      statusCode: HttpStatus.NOT_FOUND,
    });
    expect(logError).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not found',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      },
      HttpStatus.NOT_FOUND,
    );
  });

  it('should normalize ThrottlerException to a 429 envelope and log a warning once', () => {
    const { filter, host, httpAdapter, response } = createSut();

    filter.catch(new ThrottlerException(), host);

    expect(logWarn).toHaveBeenCalledTimes(1);
    expect(logWarn).toHaveBeenCalledWith('http.request.failure', 'Too many requests', {
      errorCode: 'RATE_LIMIT_EXCEEDED',
      method: 'GET',
      path: '/api/translation',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(logError).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });

  it('should normalize unknown errors to a 500 envelope and log an error once', () => {
    const { filter, host, httpAdapter, response } = createSut();
    const exception = new Error('Database connection failed');

    filter.catch(exception, host);

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('http.request.failure', exception, {
      errorCode: 'INTERNAL_ERROR',
      method: 'GET',
      path: '/api/translation',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
    expect(logWarn).not.toHaveBeenCalled();
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('should normalize BadRequestException message arrays into validation details', () => {
    const { filter, host, httpAdapter, response } = createSut();
    const exception = new BadRequestException({
      message: ['outputLanguageId must be a number', 'text should not be empty'],
      error: 'Bad Request',
      statusCode: HttpStatus.BAD_REQUEST,
    });

    filter.catch(exception, host);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'outputLanguageId must be a number',
          details: [{ message: 'outputLanguageId must be a number' }, { message: 'text should not be empty' }],
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  });
});
