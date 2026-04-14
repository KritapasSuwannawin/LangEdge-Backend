import { AuthController } from './auth.controller';

import { RefreshTokenDto } from '@/controllers/auth/dto/refresh-token.dto';
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token.use-case';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRefreshTokenUseCase: jest.Mocked<Pick<RefreshTokenUseCase, 'execute'>>;

  beforeEach(() => {
    mockRefreshTokenUseCase = {
      execute: jest.fn(),
    };

    controller = new AuthController(mockRefreshTokenUseCase as unknown as RefreshTokenUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    const validDto: RefreshTokenDto = { refreshToken: 'valid-refresh-token' };

    it('should return access token and refresh token as a plain payload on success', async () => {
      const mockTokenResponse = { idToken: 'new-id-token', refreshToken: 'new-refresh-token' };
      mockRefreshTokenUseCase.execute.mockResolvedValue(mockTokenResponse);

      const result = await controller.refreshToken(validDto);

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'valid-refresh-token' });
      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        accessToken: 'new-id-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should propagate service errors without controller translation', async () => {
      const useCaseError = new Error('Firebase error');
      mockRefreshTokenUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.refreshToken(validDto)).rejects.toBe(useCaseError);
    });

    it('should handle empty refresh token from use case response', async () => {
      mockRefreshTokenUseCase.execute.mockResolvedValue({ idToken: 'id', refreshToken: '' });

      const result = await controller.refreshToken(validDto);

      expect(result).toEqual({
        accessToken: 'id',
        refreshToken: '',
      });
    });
  });
});
