import { GetLanguageDto } from '@/controllers/language/dto/get-language.dto';
import { LanguageController } from '@/controllers/language/language.controller';
import { GetLanguagesUseCase } from '@/use-cases/language/get-languages.use-case';

describe('LanguageController', () => {
  let controller: LanguageController;
  let mockGetLanguagesUseCase: jest.Mocked<Pick<GetLanguagesUseCase, 'execute'>>;

  beforeEach(() => {
    mockGetLanguagesUseCase = {
      execute: jest.fn(),
    };

    controller = new LanguageController(mockGetLanguagesUseCase as unknown as GetLanguagesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLanguage', () => {
    it('should call the use case with undefined id and return all languages', async () => {
      const mockLanguages = [
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ];
      mockGetLanguagesUseCase.execute.mockResolvedValue(mockLanguages);

      const query: GetLanguageDto = {};
      const result = await controller.getLanguage(query);

      expect(mockGetLanguagesUseCase.execute).toHaveBeenCalledWith({ id: undefined });
      expect(mockGetLanguagesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ languageArr: mockLanguages });
    });

    it('should call the use case with a provided id and normalize the mapped response', async () => {
      const mockLanguage = [{ id: 1, name: 'English', code: 'en' }];
      mockGetLanguagesUseCase.execute.mockResolvedValue(mockLanguage);

      const query: GetLanguageDto = { id: 1 };
      const result = await controller.getLanguage(query);

      expect(mockGetLanguagesUseCase.execute).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ languageArr: mockLanguage });
    });

    it('should return an empty array when the use case returns no languages', async () => {
      mockGetLanguagesUseCase.execute.mockResolvedValue([]);

      const result = await controller.getLanguage({ id: 999 });

      expect(result).toEqual({ languageArr: [] });
    });

    it('should propagate use-case errors without controller translation', async () => {
      const useCaseError = new Error('Database error');
      mockGetLanguagesUseCase.execute.mockRejectedValue(useCaseError);

      await expect(controller.getLanguage({})).rejects.toBe(useCaseError);
    });
  });
});
