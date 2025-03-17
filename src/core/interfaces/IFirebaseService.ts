import { DecodedIdToken } from 'firebase-admin/auth';

export default interface IFirebaseService {
  verifyAccessToken(accessToken: string): Promise<DecodedIdToken | null>;

  refreshToken(refreshToken: string): Promise<{
    idToken: string;
    refreshToken: string;
  }>;
}
