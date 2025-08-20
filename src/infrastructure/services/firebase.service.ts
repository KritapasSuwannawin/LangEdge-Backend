import type { App } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';

import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  private auth: Auth;

  constructor(
    private readonly configService: ConfigService,
    @Inject('FIREBASE_APP') private readonly app: App,
  ) {
    this.auth = getAuth(this.app);
  }

  async verifyAccessToken(accessToken: string): Promise<DecodedIdToken | null> {
    try {
      return await this.auth.verifyIdToken(accessToken);
    } catch (error) {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
    try {
      const apiKey = this.configService.get<string>('FIREBASE_API_KEY');
      const tokenDataResponse = await (
        await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        })
      ).json();

      if (!tokenDataResponse.id_token || !tokenDataResponse.refresh_token) {
        throw new Error('Failed to parse token data');
      }

      return {
        idToken: tokenDataResponse.id_token,
        refreshToken: tokenDataResponse.refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }
}
