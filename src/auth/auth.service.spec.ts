import { AuthService } from './auth.service';

import { FirebaseService } from '../infrastructure/services/firebase.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockFirebaseService: jest.Mocked<Pick<FirebaseService, 'refreshToken'>>;

  beforeEach(() => {
    mockFirebaseService = {
      refreshToken: jest.fn(),
    };
    service = new AuthService(mockFirebaseService as unknown as FirebaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshToken', () => {
    it('should forward the refresh token to FirebaseService', async () => {
      const mockResponse = { idToken: 'new-id-token', refreshToken: 'new-refresh-token' };
      mockFirebaseService.refreshToken.mockResolvedValue(mockResponse);

      const result = await service.refreshToken('my-refresh-token');

      expect(mockFirebaseService.refreshToken).toHaveBeenCalledWith('my-refresh-token');
      expect(mockFirebaseService.refreshToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from FirebaseService', async () => {
      mockFirebaseService.refreshToken.mockRejectedValue(new Error('Token expired'));

      await expect(service.refreshToken('expired-token')).rejects.toThrow('Token expired');
    });

    it('should handle empty string refresh token', async () => {
      const mockResponse = { idToken: 'id', refreshToken: 'r' };
      mockFirebaseService.refreshToken.mockResolvedValue(mockResponse);

      await service.refreshToken('');

      expect(mockFirebaseService.refreshToken).toHaveBeenCalledWith('');
    });

    it('should return the exact response from FirebaseService', async () => {
      const mockResponse = { idToken: 'specific-id', refreshToken: 'specific-refresh' };
      mockFirebaseService.refreshToken.mockResolvedValue(mockResponse);

      const result = await service.refreshToken('any-token');

      expect(result).toBe(mockResponse); // Same reference check
    });
  });
});
