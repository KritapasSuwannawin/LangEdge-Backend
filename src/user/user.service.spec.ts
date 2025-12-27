import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';

jest.mock('../shared/utils/httpUtils', () => ({
  downloadFile: jest.fn().mockResolvedValue(Buffer.from('img')),
}));

describe('UserService', () => {
  let service: UserService;
  const mockRepo: any = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    mockRepo.findOne.mockReset();
    mockRepo.save.mockReset();
    mockRepo.create.mockReset();

    service = new UserService(mockRepo as any);
  });

  test('updateUser updates existing user last_used_language_id', async () => {
    const user = { id: 'u1', last_used_language_id: null };
    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockResolvedValue({ ...user, last_used_language_id: 2 });

    await service.updateUser('u1', { lastUsedLanguageId: 2 } as any);

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(user.last_used_language_id).toBe(2);
  });

  test('updateUser throws BadRequestException when user not found', async () => {
    mockRepo.findOne.mockResolvedValue(undefined);

    await expect(service.updateUser('u2', { lastUsedLanguageId: 1 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('signInUser creates new user and returns picture data', async () => {
    mockRepo.findOne.mockResolvedValue(undefined);
    mockRepo.create.mockReturnValue({ id: 'u3', email: 'a@a', name: 'n' });
    mockRepo.save.mockResolvedValue({ id: 'u3', last_used_language_id: 5 });

    const res = await service.signInUser('u3', 'a@a', 'n', 'http://pic');

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
    expect(res.lastUsedLanguageId).toBe(5);
    expect(res.pictureUrl).toBeDefined();
  });

  test('signInUser updates existing user and returns undefined picture when no url', async () => {
    const existing = { id: 'u4', email: 'b@b', name: 'old' };
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockResolvedValue({ ...existing, last_used_language_id: undefined });

    const res = await service.signInUser('u4', 'b@b', 'new');

    expect(mockRepo.save).toHaveBeenCalled();
    expect(res.lastUsedLanguageId).toBeUndefined();
    expect(res.pictureUrl).toBeUndefined();
  });
});
