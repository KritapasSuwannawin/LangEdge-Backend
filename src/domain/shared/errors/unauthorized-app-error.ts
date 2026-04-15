import { AppError } from '@/domain/shared/errors/app-error';
import { AppErrorDetail } from '@/domain/shared/errors/app-error-detail';

interface UnauthorizedAppErrorOptions {
  readonly code?: string;
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Shared unauthorized error used below the HTTP transport layer. */
export class UnauthorizedAppError extends AppError {
  constructor({ code = 'UNAUTHORIZED', publicMessage = 'Unauthorized', details }: UnauthorizedAppErrorOptions = {}) {
    super({ code, statusCode: 401, publicMessage, details });
  }
}
