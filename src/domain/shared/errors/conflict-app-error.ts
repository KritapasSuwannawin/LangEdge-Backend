import { AppError } from './app-error';
import { AppErrorDetail } from './app-error-detail';

interface ConflictAppErrorOptions {
  readonly code?: string;
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Shared conflict error used below the HTTP transport layer. */
export class ConflictAppError extends AppError {
  constructor({ code = 'CONFLICT', publicMessage = 'Conflict', details }: ConflictAppErrorOptions = {}) {
    super({ code, statusCode: 409, publicMessage, details });
  }
}
