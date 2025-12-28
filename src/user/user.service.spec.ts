import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { UserService } from './user.service';
import { User } from '../infrastructure/database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

jest.mock('../shared/utils/httpUtils', () => ({
  downloadFile: jest.fn().mockResolvedValue(Buffer.from('img')),
}));

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save' | 'create'>>;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    service = new UserService(mockRepo as unknown as Repository<User>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUser', () => {
    it('should update existing user last_used_language_id successfully', async () => {
      const existingUser = { id: 'user-1', last_used_language_id: null } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue({ ...existingUser, last_used_language_id: 2 } as User);

      const body: UpdateUserDto = { lastUsedLanguageId: 2 };
      await service.updateUser('user-1', body);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(existingUser.last_used_language_id).toBe(2);
    });

    it('should throw BadRequestException when user is not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const body: UpdateUserDto = { lastUsedLanguageId: 1 };

      await expect(service.updateUser('nonexistent-user', body)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.updateUser('nonexistent-user', body)).rejects.toThrow('Bad request');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should handle updating language id to null/undefined', async () => {
      const existingUser = { id: 'user-2', last_used_language_id: 5 } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue({ ...existingUser, last_used_language_id: null } as User);

      const body = { lastUsedLanguageId: null } as unknown as UpdateUserDto;
      await service.updateUser('user-2', body);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(existingUser.last_used_language_id).toBeNull();
    });

    it('should propagate database errors', async () => {
      const existingUser = { id: 'user-3', last_used_language_id: 1 } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockRejectedValue(new Error('Database error'));

      const body: UpdateUserDto = { lastUsedLanguageId: 2 };

      await expect(service.updateUser('user-3', body)).rejects.toThrow('Database error');
    });
  });

  describe('signInUser', () => {
    it('should create new user and return picture data when user does not exist', async () => {
      const { downloadFile } = require('../shared/utils/httpUtils');
      downloadFile.mockResolvedValue(Buffer.from('downloaded-image'));

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'new-user', email: 'new@example.com', name: 'New User' } as User);
      mockRepo.save.mockResolvedValue({ id: 'new-user', last_used_language_id: 5 } as User);

      const result = await service.signInUser('new-user', 'new@example.com', 'New User', 'http://picture.url');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'new-user' } });
      expect(mockRepo.create).toHaveBeenCalledWith({
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
        picture_url: 'http://picture.url',
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(downloadFile).toHaveBeenCalledWith('http://picture.url');
      expect(result.lastUsedLanguageId).toBe(5);
      expect(result.pictureUrl).toBeDefined();
    });

    it('should update existing user and return picture data', async () => {
      const { downloadFile } = require('../shared/utils/httpUtils');
      downloadFile.mockResolvedValue(Buffer.from('updated-image'));

      const existingUser = { id: 'existing-user', email: 'old@example.com', name: 'Old Name' } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue({ ...existingUser, last_used_language_id: 10 } as User);

      const result = await service.signInUser('existing-user', 'updated@example.com', 'Updated Name', 'http://new-picture.url');

      expect(existingUser.email).toBe('updated@example.com');
      expect(existingUser.name).toBe('Updated Name');
      expect(existingUser.picture_url).toBe('http://new-picture.url');
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.lastUsedLanguageId).toBe(10);
      expect(result.pictureUrl).toBeDefined();
    });

    it('should return undefined picture when no picture URL is provided for new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'no-pic-user', email: 'nopic@example.com', name: 'No Pic' } as User);
      mockRepo.save.mockResolvedValue({
        id: 'no-pic-user',
        last_used_language_id: null,
        email: 'nopic@example.com',
        name: 'No Pic',
        picture_url: null,
        created_at: new Date(),
      } as User);

      const result = await service.signInUser('no-pic-user', 'nopic@example.com', 'No Pic');

      expect(mockRepo.create).toHaveBeenCalledWith({
        id: 'no-pic-user',
        email: 'nopic@example.com',
        name: 'No Pic',
        picture_url: null,
      });
      expect(result.pictureUrl).toBeUndefined();
      expect(result.lastUsedLanguageId).toBeUndefined();
    });

    it('should return undefined picture when no picture URL is provided for existing user', async () => {
      const existingUser = { id: 'existing-no-pic', email: 'old@example.com', name: 'Old Name' } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue({ ...existingUser, last_used_language_id: null } as User);

      const result = await service.signInUser('existing-no-pic', 'updated@example.com', 'Updated Name');

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.pictureUrl).toBeUndefined();
      expect(result.lastUsedLanguageId).toBeUndefined();
    });

    it('should not overwrite existing picture_url when new picture URL is not provided', async () => {
      const existingUser = { id: 'keep-pic', email: 'old@example.com', name: 'Old Name', picture_url: 'http://old-pic.url' } as User;
      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue({ ...existingUser } as User);

      await service.signInUser('keep-pic', 'new@example.com', 'New Name');

      expect(existingUser.picture_url).toBe('http://old-pic.url'); // Should remain unchanged
    });

    it('should handle download errors gracefully', async () => {
      const { downloadFile } = require('../shared/utils/httpUtils');
      downloadFile.mockRejectedValue(new Error('Download failed'));

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'download-fail', email: 'test@example.com', name: 'Test' } as User);
      mockRepo.save.mockResolvedValue({ id: 'download-fail', last_used_language_id: 1 } as User);

      await expect(service.signInUser('download-fail', 'test@example.com', 'Test', 'http://bad-url.com')).rejects.toThrow(
        'Download failed',
      );
    });

    it('should propagate save errors for new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ id: 'save-fail', email: 'test@example.com', name: 'Test' } as User);
      mockRepo.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.signInUser('save-fail', 'test@example.com', 'Test')).rejects.toThrow('Save failed');
    });
  });
});
