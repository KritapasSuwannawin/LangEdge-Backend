import type { App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import type { DecodedToken } from '@/domain/shared/auth.types';

@Injectable()
export class FirebaseAuthAdapter implements IAuthPort {
  private readonly auth: Auth;

  constructor(
    private readonly configService: ConfigService,
    @Inject('FIREBASE_APP') private readonly app: App,
  ) {
    this.auth = getAuth(this.app);
  }

  async verifyToken(accessToken: string): Promise<DecodedToken | null> {
    try {
      const decodedToken = await this.auth.verifyIdToken(accessToken);

      return {
        uid: decodedToken.uid,
        user_id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
    } catch {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
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
  }
}
