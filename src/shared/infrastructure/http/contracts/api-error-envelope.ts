import { ApiErrorBody } from '@/shared/infrastructure/http/contracts/api-error-body';

/** Shared HTTP error envelope. */
export interface ApiErrorEnvelope {
  readonly statusCode: number;
  readonly message: string;
  readonly error: ApiErrorBody;
}
