import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockFirebase: any = { refreshToken: jest.fn() };

  beforeEach(() => {
    mockFirebase.refreshToken.mockReset();
    service = new AuthService(mockFirebase as any);
  });

  test('refreshToken forwards to FirebaseService', async () => {
    mockFirebase.refreshToken.mockResolvedValue({ idToken: 'id', refreshToken: 'r' });
    const res = await service.refreshToken('rt');
    expect(mockFirebase.refreshToken).toHaveBeenCalledWith('rt');
    expect(res).toEqual({ idToken: 'id', refreshToken: 'r' });
  });
});
