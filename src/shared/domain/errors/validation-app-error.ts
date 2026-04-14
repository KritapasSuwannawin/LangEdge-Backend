import { AppError } from '@/shared/domain/errors/app-error';
import { AppErrorDetail } from '@/shared/domain/errors/app-error-detail';

interface ValidationAppErrorOptions {
  readonly code?: string;
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

const getDefaultPublicMessage = (details?: ReadonlyArray<AppErrorDetail>): string => {
  return details?.[0]?.message ?? 'Validation failed';
};

/** Shared validation error used below the HTTP transport layer. */
export class ValidationAppError extends AppError {
  constructor({ code = 'VALIDATION_ERROR', publicMessage, details }: ValidationAppErrorOptions = {}) {
    super({
      code,
      statusCode: 400,
      publicMessage: publicMessage ?? getDefaultPublicMessage(details),
      details,
    });
  }
}
