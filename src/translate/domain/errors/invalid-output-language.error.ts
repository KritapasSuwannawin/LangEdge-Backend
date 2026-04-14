import { AppErrorDetail } from '@/shared/domain/errors/app-error-detail';
import { ValidationAppError } from '@/shared/domain/errors/validation-app-error';

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
