import { RefreshTokenResponseDto } from '@/controllers/auth/dto/refresh-token-response.dto';

interface RefreshTokenResponseSource {
  readonly idToken: string;
  readonly refreshToken: string;
}

export const mapRefreshTokenResponse = (source: RefreshTokenResponseSource): RefreshTokenResponseDto => {
  return {
    accessToken: source.idToken,
    refreshToken: source.refreshToken,
  };
};
