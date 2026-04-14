export interface RefreshTokenInput {
  readonly refreshToken: string;
}

export interface RefreshTokenResult {
  readonly idToken: string;
  readonly refreshToken: string;
}
