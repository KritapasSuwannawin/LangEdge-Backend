import { AppError } from './app-error';
import { AppErrorDetail } from './app-error-detail';

interface NotFoundAppErrorOptions {
  readonly code?: string;
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Shared not-found error used below the HTTP transport layer. */
export class NotFoundAppError extends AppError {
  constructor({ code = 'NOT_FOUND', publicMessage = 'Not found', details }: NotFoundAppErrorOptions = {}) {
    super({ code, statusCode: 404, publicMessage, details });
  }
}
