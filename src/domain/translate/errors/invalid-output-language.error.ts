import { AppErrorDetail } from '@/domain/shared/errors/app-error-detail';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';

interface InvalidOutputLanguageErrorOptions {
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Translation-specific validation error for unsupported output language identifiers. */
export class InvalidOutputLanguageError extends ValidationAppError {
  constructor({ publicMessage = 'Invalid output language', details }: InvalidOutputLanguageErrorOptions = {}) {
    super({ code: 'INVALID_OUTPUT_LANGUAGE', publicMessage, details });
  }
}
