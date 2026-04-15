import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { FirebaseAuthAdapter } from './firebase-auth.adapter';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseAuthAdapter', () => {
  let adapter: FirebaseAuthAdapter;
  let mockConfig: jest.Mocked<Pick<ConfigService, 'get'>>;
  let mockAuth: { verifyIdToken: jest.Mock };
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    mockConfig = { get: jest.fn() };
    mockAuth = { verifyIdToken: jest.fn() };
    originalFetch = global.fetch;
    global.fetch = jest.fn();

    const { getAuth } = require('firebase-admin/auth') as { getAuth: jest.Mock };
    getAuth.mockReturnValue(mockAuth);

    adapter = new FirebaseAuthAdapter(mockConfig as unknown as ConfigService, {} as App);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('should map a verified Firebase token into the repo-owned auth type', async () => {
      const decodedToken: Partial<DecodedIdToken> = {
        uid: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.png',
      };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      const result = await adapter.verifyToken('valid-token');

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        uid: 'user-123',
        user_id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.png',
      });
    });

    it('should return null when Firebase token verification fails', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

      const result = await adapter.verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should return refreshed tokens on success', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          id_token: 'new-id-token',
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await adapter.refreshToken('old-refresh-token');

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

    it('should throw when Firebase returns an incomplete refresh payload', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ refresh_token: 'missing-id-token' }),
      });

      await expect(adapter.refreshToken('old-refresh-token')).rejects.toThrow('Failed to parse token data');
    });

    it('should propagate fetch failures', async () => {
      mockConfig.get.mockReturnValue('test-api-key');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(adapter.refreshToken('old-refresh-token')).rejects.toThrow('Network error');
    });
  });
});
