import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token.use-case';
import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import type { DecodedToken } from '@/domain/shared/auth.types';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockAuthPort: jest.Mocked<IAuthPort>;

  beforeEach(() => {
    mockAuthPort = {
      verifyToken: jest.fn<Promise<DecodedToken | null>, [string]>(),
      refreshToken: jest.fn(),
    };

    useCase = new RefreshTokenUseCase(mockAuthPort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should forward the refresh token to IAuthPort', async () => {
      const mockResponse = { idToken: 'new-id-token', refreshToken: 'new-refresh-token' };
      mockAuthPort.refreshToken.mockResolvedValue(mockResponse);

      const result = await useCase.execute({ refreshToken: 'my-refresh-token' });

      expect(mockAuthPort.refreshToken).toHaveBeenCalledWith('my-refresh-token');
      expect(mockAuthPort.refreshToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from IAuthPort', async () => {
      const authPortError = new Error('Token expired');
      mockAuthPort.refreshToken.mockRejectedValue(authPortError);

      await expect(useCase.execute({ refreshToken: 'expired-token' })).rejects.toBe(authPortError);
    });

    it('should allow empty refresh tokens to pass through unchanged', async () => {
      mockAuthPort.refreshToken.mockResolvedValue({ idToken: 'id', refreshToken: 'r' });

      await useCase.execute({ refreshToken: '' });

      expect(mockAuthPort.refreshToken).toHaveBeenCalledWith('');
    });
  });
});
