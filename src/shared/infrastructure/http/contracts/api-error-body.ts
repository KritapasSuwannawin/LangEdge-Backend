import { ApiErrorDetail } from '@/shared/infrastructure/http/contracts/api-error-detail';

/** Shared HTTP error payload body. */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: ReadonlyArray<ApiErrorDetail>;
}
