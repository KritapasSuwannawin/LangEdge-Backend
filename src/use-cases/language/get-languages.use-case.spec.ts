import type { LanguageRecord } from '@/domain/language/language.record';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';
import { GetLanguagesUseCase } from '@/use-cases/language/get-languages.use-case';

describe('GetLanguagesUseCase', () => {
  let useCase: GetLanguagesUseCase;
  let mockLanguageRepository: jest.Mocked<ILanguageRepository>;

  const englishLanguage: LanguageRecord = {
    id: 1,
    name: 'English',
    code: 'en',
  };

  const spanishLanguage: LanguageRecord = {
    id: 2,
    name: 'Spanish',
    code: 'es',
  };

  beforeEach(() => {
    mockLanguageRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new GetLanguagesUseCase(mockLanguageRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all languages when id is undefined', async () => {
      mockLanguageRepository.findAll.mockResolvedValue([englishLanguage, spanishLanguage]);

      const result = await useCase.execute({ id: undefined });

      expect(mockLanguageRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockLanguageRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual([englishLanguage, spanishLanguage]);
    });

    it('should return a single-item array when id is provided and the language exists', async () => {
      mockLanguageRepository.findById.mockResolvedValue(englishLanguage);

      const result = await useCase.execute({ id: 1 });

      expect(mockLanguageRepository.findById).toHaveBeenCalledWith(1);
      expect(mockLanguageRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([englishLanguage]);
    });

    it('should return an empty array when id is provided and the language does not exist', async () => {
      mockLanguageRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({ id: 999 });

      expect(mockLanguageRepository.findById).toHaveBeenCalledWith(999);
      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database unavailable');
      mockLanguageRepository.findAll.mockRejectedValue(repositoryError);

      await expect(useCase.execute({ id: undefined })).rejects.toBe(repositoryError);
    });
  });
});
