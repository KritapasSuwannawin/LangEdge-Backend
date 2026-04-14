import { AppErrorDetail } from '@/shared/domain/errors/app-error-detail';

interface AppErrorOptions {
  readonly code: string;
  readonly statusCode: number;
  readonly publicMessage: string;
  readonly details?: ReadonlyArray<AppErrorDetail>;
}

/** Framework-free base error for application failures. */
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly publicMessage: string;
  public readonly details?: ReadonlyArray<AppErrorDetail>;

  protected constructor({ code, statusCode, publicMessage, details }: AppErrorOptions) {
    super(publicMessage);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
    this.details = details;
  }
}
