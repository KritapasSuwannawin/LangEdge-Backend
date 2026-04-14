import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ThrottlerException } from '@nestjs/throttler';

import { AppError } from '@/domain/shared/errors/app-error';
import { ApiErrorDetail } from '@/shared/infrastructure/http/contracts/api-error-detail';
import { ApiErrorEnvelope } from '@/shared/infrastructure/http/contracts/api-error-envelope';
import { logError, logWarn } from '@/shared/utils/systemUtils';

const REQUEST_FAILURE_LOG_CONTEXT = 'http.request.failure';

const HTTP_STATUS_MESSAGES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Invalid input',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.NOT_FOUND]: 'Not found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
};

const HTTP_STATUS_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

interface NormalizedException {
  readonly statusCode: number;
  readonly body: ApiErrorEnvelope;
}

interface HttpExceptionResponsePayload {
  readonly code?: string;
  readonly details?: ReadonlyArray<ApiErrorDetail>;
  readonly error?: string;
  readonly message?: string | ReadonlyArray<string>;
  readonly statusCode?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isApiErrorDetailArray = (value: unknown): value is ReadonlyArray<ApiErrorDetail> => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((detail) => {
    if (!isRecord(detail) || typeof detail.message !== 'string') {
      return false;
    }

    return detail.field === undefined || typeof detail.field === 'string';
  });
};

const readMessage = (value: unknown): string | ReadonlyArray<string> | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  return undefined;
};

const getHttpExceptionResponsePayload = (response: unknown): HttpExceptionResponsePayload | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }

  return {
    code: typeof response.code === 'string' ? response.code : undefined,
    details: isApiErrorDetailArray(response.details) ? response.details : undefined,
    error: typeof response.error === 'string' ? response.error : undefined,
    message: readMessage(response.message),
    statusCode: typeof response.statusCode === 'number' ? response.statusCode : undefined,
  };
};

const getTopLevelMessage = (statusCode: number): string => {
  return HTTP_STATUS_MESSAGES[statusCode] ?? HTTP_STATUS_MESSAGES[HttpStatus.INTERNAL_SERVER_ERROR];
};

const getDefaultErrorCode = (statusCode: number): string => {
  return HTTP_STATUS_CODES[statusCode] ?? HTTP_STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR];
};

const createErrorDetailsFromMessages = (messages: ReadonlyArray<string>): ReadonlyArray<ApiErrorDetail> | undefined => {
  if (messages.length === 0) {
    return undefined;
  }

  return messages.map((message) => ({ message }));
};

const getHttpExceptionMessages = (response: unknown): ReadonlyArray<string> => {
  if (typeof response === 'string') {
    return [response];
  }

  const payload = getHttpExceptionResponsePayload(response);

  if (!payload?.message) {
    return [];
  }

  return typeof payload.message === 'string' ? [payload.message] : payload.message;
};

const getHttpExceptionDetails = (response: unknown): ReadonlyArray<ApiErrorDetail> | undefined => {
  const payload = getHttpExceptionResponsePayload(response);

  if (payload?.details && payload.details.length > 0) {
    return payload.details;
  }

  return createErrorDetailsFromMessages(getHttpExceptionMessages(response));
};

const createEnvelope = (
  statusCode: number,
  code: string,
  publicMessage: string,
  details?: ReadonlyArray<ApiErrorDetail>,
): NormalizedException => {
  return {
    statusCode,
    body: {
      statusCode,
      message: getTopLevelMessage(statusCode),
      error: {
        code,
        message: publicMessage,
        ...(details && details.length > 0 ? { details } : {}),
      },
    },
  };
};

const normalizeAppError = (exception: AppError): NormalizedException => {
  return createEnvelope(exception.statusCode, exception.code, exception.publicMessage, exception.details);
};

const normalizeHttpException = (exception: HttpException): NormalizedException => {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();
  const details = statusCode === HttpStatus.BAD_REQUEST ? getHttpExceptionDetails(response) : undefined;
  const publicMessage =
    statusCode === HttpStatus.BAD_REQUEST ? (details?.[0]?.message ?? getTopLevelMessage(statusCode)) : getTopLevelMessage(statusCode);

  return createEnvelope(statusCode, getDefaultErrorCode(statusCode), publicMessage, details);
};

const normalizeThrottlerException = (): NormalizedException => {
  return createEnvelope(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
};

const normalizeUnknownException = (): NormalizedException => {
  return createEnvelope(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', 'Internal server error');
};

const normalizeException = (exception: unknown): NormalizedException => {
  if (exception instanceof AppError) {
    return normalizeAppError(exception);
  }

  if (exception instanceof ThrottlerException) {
    return normalizeThrottlerException();
  }

  if (exception instanceof HttpException) {
    return normalizeHttpException(exception);
  }

  return normalizeUnknownException();
};

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const httpHost = host.switchToHttp();
    const request = httpHost.getRequest();
    const response = httpHost.getResponse();
    const normalizedException = normalizeException(exception);
    const method = httpAdapter.getRequestMethod(request);
    const path = httpAdapter.getRequestUrl(request);
    const logMetadata = {
      errorCode: normalizedException.body.error.code,
      method,
      path,
      statusCode: normalizedException.statusCode,
    };

    if (normalizedException.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      logError(REQUEST_FAILURE_LOG_CONTEXT, exception, logMetadata);
    } else {
      logWarn(REQUEST_FAILURE_LOG_CONTEXT, normalizedException.body.error.message, logMetadata);
    }

    httpAdapter.reply(response, normalizedException.body, normalizedException.statusCode);
  }
}
