import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import zod from 'zod';

import IFirebaseService from '../../core/interfaces/IFirebaseService';

import { logError } from '../../shared/utils/systemUtils';

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!) as ServiceAccount) });

export default class FirebaseService implements IFirebaseService {
  async verifyAccessToken(accessToken: string, auth: Auth = getAuth()) {
    try {
      return await auth.verifyIdToken(accessToken);
    } catch (error) {
      logError('FirebaseService.verifyAccessToken', error);
      return null;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const tokenDataResponse = await (
        await fetch(`https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        })
      ).json();

      const tokenDataSchema = zod.object({
        id_token: zod.string(),
        refresh_token: zod.string(),
      });

      const { success, data } = tokenDataSchema.safeParse(tokenDataResponse);

      if (!success) {
        throw new Error('Failed to parse token data');
      }

      return {
        idToken: data.id_token,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      logError('FirebaseService.refreshToken', error);
      throw error;
    }
  }
}
