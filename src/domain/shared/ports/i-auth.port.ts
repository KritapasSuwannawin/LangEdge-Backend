import type { DecodedToken } from '@/domain/shared/auth.types';

export interface IAuthPort {
  verifyToken(accessToken: string): Promise<DecodedToken | null>;
  refreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }>;
}
