import IFirebaseService from '../../../core/interfaces/IFirebaseService';

import FirebaseService from '../../../infrastructure/services/FirebaseService';

import { logError } from '../../../shared/utils/systemUtils';

export default class RefreshTokenUseCase {
  private firebaseService: IFirebaseService;

  constructor(firebaseService = new FirebaseService()) {
    this.firebaseService = firebaseService;
  }

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const tokenData = await this.firebaseService.refreshToken(refreshToken);

      return {
        accessToken: tokenData.idToken,
        refreshToken: tokenData.refreshToken,
      };
    } catch (error) {
      logError('RefreshTokenUseCase.execute', error);
      throw error;
    }
  }
}
