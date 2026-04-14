import { AppError } from '@/domain/shared/errors/app-error';
import { AppErrorDetail } from '@/domain/shared/errors/app-error-detail';

interface TranslationFailedErrorOptions {
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Translation-specific application error for translation provider failures. */
export class TranslationFailedError extends AppError {
  constructor({ publicMessage = 'Failed to translate text', details }: TranslationFailedErrorOptions = {}) {
    super({
      code: 'TRANSLATION_FAILED',
      statusCode: 500,
      publicMessage,
      details,
    });
  }
}
