import type { Request } from 'express';

import { UserController } from './user.controller';

import { UpdateUserDto } from '@/controllers/user/dto/update-user.dto';
import { NotFoundAppError } from '@/domain/shared/errors/not-found-app-error';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { SignInUserUseCase } from '@/use-cases/user/sign-in-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';

interface MockRequest {
  user?: Record<string, unknown>;
}

describe('UserController', () => {
  let controller: UserController;
  let mockSignInUserUseCase: jest.Mocked<Pick<SignInUserUseCase, 'execute'>>;
  let mockUpdateUserUseCase: jest.Mocked<Pick<UpdateUserUseCase, 'execute'>>;

  beforeEach(() => {
    mockSignInUserUseCase = { execute: jest.fn() };
    mockUpdateUserUseCase = { execute: jest.fn() };
    controller = new UserController(
      mockSignInUserUseCase as unknown as SignInUserUseCase,
      mockUpdateUserUseCase as unknown as UpdateUserUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUser', () => {
    const createMockRequest = (user: Record<string, unknown>): MockRequest => ({
      user,
    });

    it('should return success message when user is updated successfully', async () => {
      const req = createMockRequest({ user_id: 'user-123' });
      const body: UpdateUserDto = { lastUsedLanguageId: 2 };
      mockUpdateUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.updateUser(req as unknown as Request, body);

      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123', lastUsedLanguageId: 2 });
      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Success' });
    });

    it('should fall back to uid when user_id is not present in auth context', async () => {
      const req = createMockRequest({ uid: 'user-uid-123' });
      const body: UpdateUserDto = { lastUsedLanguageId: 4 };
      mockUpdateUserUseCase.execute.mockResolvedValue(undefined);

      await controller.updateUser(req as unknown as Request, body);

      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-uid-123', lastUsedLanguageId: 4 });
    });

    it('should propagate use-case errors without controller translation', async () => {
      const req = createMockRequest({ user_id: 'user-456' });
      const body: UpdateUserDto = { lastUsedLanguageId: 99 };
      const useCaseError = new NotFoundAppError({ code: 'USER_NOT_FOUND', publicMessage: 'User not found' });
      mockUpdateUserUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toBe(useCaseError);
    });

    it('should throw ValidationAppError when auth context has no user id', async () => {
      const req = createMockRequest({});
      const body: UpdateUserDto = { lastUsedLanguageId: 1 };

      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toBeInstanceOf(ValidationAppError);
      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toMatchObject({
        publicMessage: 'Authenticated user id is required',
      });
    });

    it('should handle undefined lastUsedLanguageId', async () => {
      const req = createMockRequest({ user_id: 'user-abc' });
      const body = {} as UpdateUserDto;
      mockUpdateUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.updateUser(req as unknown as Request, body);

      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith({ userId: 'user-abc', lastUsedLanguageId: undefined });
      expect(result).toEqual({ message: 'Success' });
    });
  });

  describe('signInUser', () => {
    it('should throw ValidationAppError when email is missing', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-1', name: 'Test User' },
      };

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(ValidationAppError);
      await expect(controller.signInUser(req as unknown as Request)).rejects.toMatchObject({ publicMessage: 'Email is required' });
    });

    it('should throw ValidationAppError when name is missing', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-2', email: 'test@example.com' },
      };

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(ValidationAppError);
      await expect(controller.signInUser(req as unknown as Request)).rejects.toMatchObject({ publicMessage: 'Name is required' });
    });

    it('should return user data as a plain payload when use-case succeeds', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-3', email: 'test@example.com', name: 'Test User', picture: 'http://pic.url' },
      };
      mockSignInUserUseCase.execute.mockResolvedValue({
        pictureUrl: 'base64-encoded-picture',
        lastUsedLanguageId: 5,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(mockSignInUserUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-3',
        email: 'test@example.com',
        name: 'Test User',
        pictureUrl: 'http://pic.url',
      });
      expect(result).toEqual({
        userId: 'user-3',
        email: 'test@example.com',
        name: 'Test User',
        pictureUrl: 'base64-encoded-picture',
        lastUsedLanguageId: 5,
      });
    });

    it('should return user data without picture when picture URL is not provided', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-4', email: 'nopicture@example.com', name: 'No Picture User' },
      };
      mockSignInUserUseCase.execute.mockResolvedValue({
        pictureUrl: undefined,
        lastUsedLanguageId: undefined,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(mockSignInUserUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-4',
        email: 'nopicture@example.com',
        name: 'No Picture User',
        pictureUrl: undefined,
      });
      expect(result).toEqual({
        userId: 'user-4',
        email: 'nopicture@example.com',
        name: 'No Picture User',
        pictureUrl: undefined,
        lastUsedLanguageId: undefined,
      });
    });

    it('should propagate use-case errors without controller translation', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-5', email: 'error@example.com', name: 'Error User' },
      };
      const useCaseError = new Error('Use-case error');
      mockSignInUserUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBe(useCaseError);
    });

    it('should handle user with all fields populated', async () => {
      const req: MockRequest = {
        user: { user_id: 'full-user', email: 'full@example.com', name: 'Full User', picture: 'http://full.pic' },
      };
      mockSignInUserUseCase.execute.mockResolvedValue({
        pictureUrl: 'full-picture-data',
        lastUsedLanguageId: 10,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(result).toHaveProperty('userId', 'full-user');
      expect(result).toHaveProperty('email', 'full@example.com');
      expect(result).toHaveProperty('name', 'Full User');
      expect(result).toHaveProperty('pictureUrl', 'full-picture-data');
      expect(result).toHaveProperty('lastUsedLanguageId', 10);
    });
  });
});
