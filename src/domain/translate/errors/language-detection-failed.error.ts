import { AppError } from '@/domain/shared/errors/app-error';
import { AppErrorDetail } from '@/domain/shared/errors/app-error-detail';

interface LanguageDetectionFailedErrorOptions {
  readonly publicMessage?: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Translation-specific application error for language detection failures. */
export class LanguageDetectionFailedError extends AppError {
  constructor({ publicMessage = 'Failed to determine language and category', details }: LanguageDetectionFailedErrorOptions = {}) {
    super({
      code: 'LANGUAGE_DETECTION_FAILED',
      statusCode: 500,
      publicMessage,
      details,
    });
  }
}
