import type { Request } from 'express';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import type { DecodedToken } from '@/domain/shared/auth.types';
import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';

import { AuthGuard } from '@/modules/auth/auth.guard';

type MockRequest = Pick<Request, 'headers'> & { user?: DecodedToken };

const createExecutionContext = (request: MockRequest): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthPort: jest.Mocked<IAuthPort>;

  beforeEach(() => {
    mockAuthPort = {
      verifyToken: jest.fn(),
      refreshToken: jest.fn(),
    };

    guard = new AuthGuard(mockAuthPort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException when the bearer token is missing', async () => {
    const context = createExecutionContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockAuthPort.verifyToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the auth port rejects the token', async () => {
    mockAuthPort.verifyToken.mockResolvedValue(null);
    const context = createExecutionContext({
      headers: { authorization: 'Bearer invalid-token' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockAuthPort.verifyToken).toHaveBeenCalledWith('invalid-token');
  });

  it('should attach the decoded token to the request when verification succeeds', async () => {
    const decodedToken: DecodedToken = {
      uid: 'user-123',
      user_id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    const request: MockRequest = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const context = createExecutionContext(request);
    mockAuthPort.verifyToken.mockResolvedValue(decodedToken);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockAuthPort.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual(decodedToken);
  });
});
