/** Shared HTTP success envelope. */
export interface ApiSuccessEnvelope<T> {
  readonly data: T;
}
