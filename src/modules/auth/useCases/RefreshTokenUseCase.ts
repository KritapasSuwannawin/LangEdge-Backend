import IFirebaseService from '../../../core/interfaces/IFirebaseService';

import { logError } from '../../../shared/utils/systemUtils';

export default class RefreshTokenUseCase {
  constructor(private tokenRepository: IFirebaseService) {}

  async execute(refreshToken: string) {
    try {
      const tokenData = await this.tokenRepository.refreshToken(refreshToken);

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
