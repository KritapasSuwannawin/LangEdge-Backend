import { AppErrorDetail } from '@/domain/shared/errors/app-error-detail';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';

interface UnsupportedInputLanguageErrorOptions {
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Translation-specific validation error for unsupported detected input languages. */
export class UnsupportedInputLanguageError extends ValidationAppError {
  constructor({ publicMessage = 'Unsupported input language', details }: UnsupportedInputLanguageErrorOptions = {}) {
    super({ code: 'UNSUPPORTED_INPUT_LANGUAGE', publicMessage, details });
  }
}
