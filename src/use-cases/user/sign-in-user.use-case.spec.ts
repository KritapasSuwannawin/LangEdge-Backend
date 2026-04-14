import { SignInUserUseCase } from '@/use-cases/user/sign-in-user.use-case';
import type { IUserRepository } from '@/repositories/user/i-user.repository';
import type { IFileDownloadPort } from '@/domain/shared/ports/i-file-download.port';
import type { UserRecord } from '@/domain/user/user.record';

describe('SignInUserUseCase', () => {
  let useCase: SignInUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockFileDownloadPort: jest.Mocked<IFileDownloadPort>;

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

    mockFileDownloadPort = {
      downloadAsBase64DataUrl: jest.fn(),
    };

    useCase = new SignInUserUseCase(mockUserRepository, mockFileDownloadPort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should upsert user and return undefined pictureUrl when no picture url is provided', async () => {
      mockUserRepository.upsert.mockResolvedValue({ ...baseUserRecord, lastUsedLanguageId: null });

      const result = await useCase.execute({
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        pictureUrl: undefined,
      });

      expect(mockUserRepository.upsert).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        pictureUrl: null,
      });
      expect(mockFileDownloadPort.downloadAsBase64DataUrl).not.toHaveBeenCalled();
      expect(result.pictureUrl).toBeUndefined();
      expect(result.lastUsedLanguageId).toBeUndefined();
    });

    it('should download picture and return base64 data url when picture url is provided', async () => {
      mockUserRepository.upsert.mockResolvedValue({ ...baseUserRecord, pictureUrl: 'http://pic.url' });
      mockFileDownloadPort.downloadAsBase64DataUrl.mockResolvedValue('data:image/png;base64,abc');

      const result = await useCase.execute({
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        pictureUrl: 'http://pic.url',
      });

      expect(mockFileDownloadPort.downloadAsBase64DataUrl).toHaveBeenCalledWith('http://pic.url');
      expect(result.pictureUrl).toBe('data:image/png;base64,abc');
    });

    it('should return lastUsedLanguageId from the upserted record when it exists', async () => {
      mockUserRepository.upsert.mockResolvedValue({ ...baseUserRecord, lastUsedLanguageId: 7 });

      const result = await useCase.execute({
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        pictureUrl: undefined,
      });

      expect(result.lastUsedLanguageId).toBe(7);
    });

    it('should propagate errors from IUserRepository.upsert', async () => {
      const repositoryError = new Error('DB error');
      mockUserRepository.upsert.mockRejectedValue(repositoryError);

      await expect(useCase.execute({ userId: 'user-1', email: 'a@b.com', name: 'Alice', pictureUrl: undefined })).rejects.toBe(
        repositoryError,
      );
    });

    it('should propagate errors from IFileDownloadPort.downloadAsBase64DataUrl', async () => {
      mockUserRepository.upsert.mockResolvedValue({ ...baseUserRecord });
      const downloadError = new Error('Download failed');
      mockFileDownloadPort.downloadAsBase64DataUrl.mockRejectedValue(downloadError);

      await expect(useCase.execute({ userId: 'user-1', email: 'a@b.com', name: 'Alice', pictureUrl: 'http://pic.url' })).rejects.toBe(
        downloadError,
      );
    });
  });
});
