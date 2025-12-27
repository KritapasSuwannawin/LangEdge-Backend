import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const mockService: any = { refreshToken: jest.fn() };

  beforeEach(() => {
    mockService.refreshToken.mockReset();
    controller = new AuthController(mockService as any);
  });

  test('refreshToken returns data wrapper on success', async () => {
    mockService.refreshToken.mockResolvedValue({ idToken: 'id', refreshToken: 'r' });
    const res = await controller.refreshToken({ refreshToken: 'r' } as any);
    expect(res).toEqual({ data: { accessToken: 'id', refreshToken: 'r' } });
  });

  test('refreshToken propagates errors as InternalServerErrorException', async () => {
    mockService.refreshToken.mockRejectedValue(new Error('boom'));
    await expect(controller.refreshToken({ refreshToken: 'r' } as any)).rejects.toThrow();
  });
});
