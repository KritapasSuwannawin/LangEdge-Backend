import { NotFoundAppError } from '@/domain/shared/errors/not-found-app-error';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import type { IUserRepository } from '@/repositories/user/i-user.repository';
import type { UserRecord } from '@/domain/user/user.record';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const baseUserRecord: UserRecord = {
    id: 'user-1',
    email: 'a@b.com',
    name: 'Alice',
    pictureUrl: null,
    createdAt: new Date(),
    lastUsedLanguageId: null,
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      upsert: jest.fn(),
      updateLastUsedLanguageId: jest.fn(),
    };

    useCase = new UpdateUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should call updateLastUsedLanguageId when user exists', async () => {
      mockUserRepository.findById.mockResolvedValue({ ...baseUserRecord });
      mockUserRepository.updateLastUsedLanguageId.mockResolvedValue(undefined);

      await useCase.execute({ userId: 'user-1', lastUsedLanguageId: 3 });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockUserRepository.updateLastUsedLanguageId).toHaveBeenCalledWith('user-1', 3);
    });

    it('should throw NotFoundAppError when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute({ userId: 'missing-user', lastUsedLanguageId: 1 })).rejects.toBeInstanceOf(NotFoundAppError);
      await expect(useCase.execute({ userId: 'missing-user', lastUsedLanguageId: 1 })).rejects.toMatchObject({
        publicMessage: 'User not found',
      });
    });

    it('should not call updateLastUsedLanguageId when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await useCase.execute({ userId: 'missing-user', lastUsedLanguageId: 1 });
      } catch {
        // expected
      }

      expect(mockUserRepository.updateLastUsedLanguageId).not.toHaveBeenCalled();
    });

    it('should propagate errors from IUserRepository.findById', async () => {
      const repositoryError = new Error('DB connection lost');
      mockUserRepository.findById.mockRejectedValue(repositoryError);

      await expect(useCase.execute({ userId: 'user-1', lastUsedLanguageId: 1 })).rejects.toBe(repositoryError);
    });

    it('should propagate errors from IUserRepository.updateLastUsedLanguageId', async () => {
      mockUserRepository.findById.mockResolvedValue({ ...baseUserRecord });
      const updateError = new Error('DB write failed');
      mockUserRepository.updateLastUsedLanguageId.mockRejectedValue(updateError);

      await expect(useCase.execute({ userId: 'user-1', lastUsedLanguageId: 5 })).rejects.toBe(updateError);
    });
  });
});
