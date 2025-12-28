import { InternalServerErrorException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<Pick<AuthService, 'refreshToken'>>;

  beforeEach(() => {
    mockService = {
      refreshToken: jest.fn(),
    };
    controller = new AuthController(mockService as unknown as AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    const validDto: RefreshTokenDto = { refreshToken: 'valid-refresh-token' };

    it('should return access token and refresh token wrapped in data object on success', async () => {
      const mockTokenResponse = { idToken: 'new-id-token', refreshToken: 'new-refresh-token' };
      mockService.refreshToken.mockResolvedValue(mockTokenResponse);

      const result = await controller.refreshToken(validDto);

      expect(mockService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockService.refreshToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        data: {
          accessToken: 'new-id-token',
          refreshToken: 'new-refresh-token',
        },
      });
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      mockService.refreshToken.mockRejectedValue(new Error('Firebase error'));

      await expect(controller.refreshToken(validDto)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.refreshToken(validDto)).rejects.toThrow('Internal server error');
    });

    it('should throw InternalServerErrorException for network errors', async () => {
      mockService.refreshToken.mockRejectedValue(new Error('Network timeout'));

      await expect(controller.refreshToken(validDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle empty refresh token from service response', async () => {
      mockService.refreshToken.mockResolvedValue({ idToken: 'id', refreshToken: '' });

      const result = await controller.refreshToken(validDto);

      expect(result).toEqual({
        data: {
          accessToken: 'id',
          refreshToken: '',
        },
      });
    });
  });
});
