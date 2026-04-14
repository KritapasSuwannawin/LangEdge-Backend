import { Injectable } from '@nestjs/common';

import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import type { DecodedToken } from '@/domain/shared/auth.types';
import { FirebaseService } from '@/infrastructure/services/firebase.service';

@Injectable()
export class FirebaseAuthAdapter implements IAuthPort {
  constructor(private readonly firebaseService: FirebaseService) {}

  async verifyToken(accessToken: string): Promise<DecodedToken | null> {
    const result = await this.firebaseService.verifyAccessToken(accessToken);
    if (!result) return null;
    return {
      uid: result.uid,
      email: result.email,
      name: result.name,
      picture: result.picture,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
    return this.firebaseService.refreshToken(refreshToken);
  }
}
