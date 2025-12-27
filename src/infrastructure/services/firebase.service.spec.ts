import { ConfigService } from '@nestjs/config';

import { FirebaseService } from './firebase.service';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseService', () => {
  let service: FirebaseService;
  const mockConfig: any = { get: jest.fn() };
  const mockApp: any = {};

  beforeEach(() => {
    jest.resetModules();
    mockConfig.get.mockReset();
    service = new FirebaseService(mockConfig as ConfigService, mockApp);
  });

  test('verifyAccessToken returns decoded token on success', async () => {
    const mockDecoded = { uid: 'u1' } as any;
    const mockAuth: any = { verifyIdToken: jest.fn().mockResolvedValue(mockDecoded) };
    const { getAuth } = require('firebase-admin/auth');
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Re-instantiate service to pick up mocked getAuth
    service = new (require('./firebase.service').FirebaseService)(mockConfig as ConfigService, mockApp);

    const res = await service.verifyAccessToken('token');
    expect(res).toEqual(mockDecoded);
    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('token');
  });

  test('verifyAccessToken returns null when verification fails', async () => {
    const mockAuth: any = { verifyIdToken: jest.fn().mockRejectedValue(new Error('fail')) };
    const { getAuth } = require('firebase-admin/auth');
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Re-instantiate service to pick up mocked getAuth
    service = new (require('./firebase.service').FirebaseService)(mockConfig as ConfigService, mockApp);

    const res = await service.verifyAccessToken('bad');
    expect(res).toBeNull();
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      // @ts-ignore
      delete global.fetch;
    });

    test('refreshToken returns tokens on success', async () => {
      mockConfig.get.mockReturnValue('API_KEY');

      const mockJson = { id_token: 'id', refresh_token: 'r' };
      // @ts-ignore
      global.fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue(mockJson) });

      const res = await service.refreshToken('rt');
      expect(res).toEqual({ idToken: 'id', refreshToken: 'r' });
      expect(mockConfig.get).toHaveBeenCalledWith('FIREBASE_API_KEY');
      // @ts-ignore
      expect(global.fetch).toHaveBeenCalled();
    });

    test('refreshToken throws when response missing tokens', async () => {
      mockConfig.get.mockReturnValue('API_KEY');
      const mockJson = { foo: 'bar' };
      // @ts-ignore
      global.fetch.mockResolvedValue({ json: jest.fn().mockResolvedValue(mockJson) });

      await expect(service.refreshToken('rt')).rejects.toThrow('Failed to parse token data');
    });
  });
});
