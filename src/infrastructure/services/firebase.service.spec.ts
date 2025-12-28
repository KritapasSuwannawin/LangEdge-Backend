import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { FirebaseService } from './firebase.service';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseService', () => {
  let service: FirebaseService;
  let mockConfig: jest.Mocked<Pick<ConfigService, 'get'>>;
  let mockApp: App;
  let mockAuth: { verifyIdToken: jest.Mock };

  beforeEach(() => {
    jest.resetModules();

    mockConfig = {
      get: jest.fn(),
    };
    mockApp = {} as App;
    mockAuth = {
      verifyIdToken: jest.fn(),
    };

    const { getAuth } = require('firebase-admin/auth');
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Re-import and instantiate service to pick up the mocked getAuth
    const { FirebaseService } = require('./firebase.service');
    service = new FirebaseService(mockConfig as unknown as ConfigService, mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAccessToken', () => {
    it('should return decoded token on successful verification', async () => {
      const mockDecodedToken: Partial<DecodedIdToken> = {
        uid: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.verifyAccessToken('valid-token');

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDecodedToken);
    });

    it('should return null when verification fails', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

      const result = await service.verifyAccessToken('invalid-token');

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null when token is malformed', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Decoding Firebase ID token failed'));

      const result = await service.verifyAccessToken('malformed-token');

      expect(result).toBeNull();
    });

    it('should return null for empty token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('ID token must be a non-empty string'));

      const result = await service.verifyAccessToken('');

      expect(result).toBeNull();
    });

    it('should handle Firebase auth errors gracefully', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Firebase Auth service unavailable'));

      const result = await service.verifyAccessToken('some-token');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return new tokens on successful refresh', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      const mockResponse = { id_token: 'new-id-token', refresh_token: 'new-refresh-token' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.refreshToken('old-refresh-token');

      expect(mockConfig.get).toHaveBeenCalledWith('FIREBASE_API_KEY');
      expect(global.fetch).toHaveBeenCalledWith('https://securetoken.googleapis.com/v1/token?key=test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=refresh_token&refresh_token=old-refresh-token',
      });
      expect(result).toEqual({
        idToken: 'new-id-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw error when response is missing id_token', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ refresh_token: 'r' }),
      });

      await expect(service.refreshToken('old-token')).rejects.toThrow('Failed to parse token data');
    });

    it('should throw error when response is missing refresh_token', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ id_token: 'id' }),
      });

      await expect(service.refreshToken('old-token')).rejects.toThrow('Failed to parse token data');
    });

    it('should throw error when response is empty', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.refreshToken('old-token')).rejects.toThrow('Failed to parse token data');
    });

    it('should throw error when fetch fails', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.refreshToken('old-token')).rejects.toThrow('Network error');
    });

    it('should throw error when JSON parsing fails', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(service.refreshToken('old-token')).rejects.toThrow('Invalid JSON');
    });

    it('should use the correct API key from config', async () => {
      mockConfig.get.mockReturnValue('my-firebase-api-key');
      const mockResponse = { id_token: 'id', refresh_token: 'r' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.refreshToken('token');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('key=my-firebase-api-key'), expect.any(Object));
    });

    it('should handle special characters in refresh token', async () => {
      mockConfig.get.mockReturnValue('api-key');
      const mockResponse = { id_token: 'id', refresh_token: 'new-token' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.refreshToken('token+with=special/chars');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('token+with=special/chars'),
        }),
      );
    });
  });
});
