import { Request } from 'express';
import { BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

interface MockRequest {
  user: {
    user_id: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: jest.Mocked<Pick<UserService, 'updateUser' | 'signInUser'>>;

  beforeEach(() => {
    mockUserService = {
      updateUser: jest.fn(),
      signInUser: jest.fn(),
    };
    controller = new UserController(mockUserService as unknown as UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUser', () => {
    const createMockRequest = (userId: string): MockRequest => ({
      user: { user_id: userId },
    });

    it('should return success message when user is updated successfully', async () => {
      const req = createMockRequest('user-123');
      const body: UpdateUserDto = { lastUsedLanguageId: 2 };
      mockUserService.updateUser.mockResolvedValue(undefined);

      const result = await controller.updateUser(req as unknown as Request, body);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-123', { lastUsedLanguageId: 2 });
      expect(mockUserService.updateUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Success' });
    });

    it('should rethrow HttpException from service', async () => {
      const req = createMockRequest('user-456');
      const body: UpdateUserDto = { lastUsedLanguageId: 99 };
      mockUserService.updateUser.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toBeInstanceOf(BadRequestException);
      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toThrow('User not found');
    });

    it('should throw InternalServerErrorException for non-HttpException errors', async () => {
      const req = createMockRequest('user-789');
      const body: UpdateUserDto = { lastUsedLanguageId: 1 };
      mockUserService.updateUser.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toBeInstanceOf(InternalServerErrorException);
      await expect(controller.updateUser(req as unknown as Request, body)).rejects.toThrow('Internal server error');
    });

    it('should handle undefined lastUsedLanguageId', async () => {
      const req = createMockRequest('user-abc');
      const body = {} as UpdateUserDto;
      mockUserService.updateUser.mockResolvedValue(undefined);

      const result = await controller.updateUser(req as unknown as Request, body);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-abc', {});
      expect(result).toEqual({ message: 'Success' });
    });
  });

  describe('signInUser', () => {
    it('should throw BadRequestException when email is missing', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-1', email: undefined, name: 'Test User' },
      };

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(BadRequestException);
      await expect(controller.signInUser(req as unknown as Request)).rejects.toThrow('Email is required');
    });

    it('should throw BadRequestException when email is empty string', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-2', email: '', name: 'Test User' },
      };

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return user data with picture when service succeeds', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-3', email: 'test@example.com', name: 'Test User', picture: 'http://pic.url' },
      };
      mockUserService.signInUser.mockResolvedValue({
        pictureUrl: 'base64-encoded-picture',
        lastUsedLanguageId: 5,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(mockUserService.signInUser).toHaveBeenCalledWith('user-3', 'test@example.com', 'Test User', 'http://pic.url');
      expect(result).toEqual({
        data: {
          userId: 'user-3',
          email: 'test@example.com',
          name: 'Test User',
          pictureUrl: 'base64-encoded-picture',
          lastUsedLanguageId: 5,
        },
      });
    });

    it('should return user data without picture when picture URL is not provided', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-4', email: 'nopicture@example.com', name: 'No Picture User' },
      };
      mockUserService.signInUser.mockResolvedValue({
        pictureUrl: undefined,
        lastUsedLanguageId: undefined,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(mockUserService.signInUser).toHaveBeenCalledWith('user-4', 'nopicture@example.com', 'No Picture User', undefined);
      expect(result).toEqual({
        data: {
          userId: 'user-4',
          email: 'nopicture@example.com',
          name: 'No Picture User',
          pictureUrl: undefined,
          lastUsedLanguageId: undefined,
        },
      });
    });

    it('should rethrow HttpException from service', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-5', email: 'error@example.com', name: 'Error User' },
      };
      mockUserService.signInUser.mockRejectedValue(new BadRequestException('Service error'));

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(HttpException);
    });

    it('should throw InternalServerErrorException for non-HttpException errors', async () => {
      const req: MockRequest = {
        user: { user_id: 'user-6', email: 'internal@example.com', name: 'Internal Error' },
      };
      mockUserService.signInUser.mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.signInUser(req as unknown as Request)).rejects.toBeInstanceOf(InternalServerErrorException);
      await expect(controller.signInUser(req as unknown as Request)).rejects.toThrow('Internal server error');
    });

    it('should handle user with all fields populated', async () => {
      const req: MockRequest = {
        user: { user_id: 'full-user', email: 'full@example.com', name: 'Full User', picture: 'http://full.pic' },
      };
      mockUserService.signInUser.mockResolvedValue({
        pictureUrl: 'full-picture-data',
        lastUsedLanguageId: 10,
      });

      const result = await controller.signInUser(req as unknown as Request);

      expect(result.data).toHaveProperty('userId', 'full-user');
      expect(result.data).toHaveProperty('email', 'full@example.com');
      expect(result.data).toHaveProperty('name', 'Full User');
      expect(result.data).toHaveProperty('pictureUrl', 'full-picture-data');
      expect(result.data).toHaveProperty('lastUsedLanguageId', 10);
    });
  });
});
