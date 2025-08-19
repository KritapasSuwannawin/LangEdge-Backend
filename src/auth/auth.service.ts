import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../infrastructure/services/firebase.service';

@Injectable()
export class AuthService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async refreshToken(token: string) {
    const result = await this.firebaseService.refreshToken(token);
    return { data: { accessToken: result.idToken, refreshToken: result.refreshToken } };
  }
}
