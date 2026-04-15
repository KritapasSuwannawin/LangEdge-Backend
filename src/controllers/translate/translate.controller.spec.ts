import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { GetTranslationUseCase } from '@/use-cases/translate/get-translation.use-case';

import { GetTranslationDto } from '@/controllers/translate/dto/get-translation.dto';
import { TranslateController } from '@/controllers/translate/translate.controller';

describe('TranslateController', () => {
  let controller: TranslateController;
  let mockUseCase: jest.Mocked<Pick<GetTranslationUseCase, 'execute'>>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    };
    controller = new TranslateController(mockUseCase as unknown as GetTranslationUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTranslation', () => {
    const baseQuery: GetTranslationDto = { text: 'Hello', outputLanguageId: 2 };

    it('should return translation as a plain payload when service resolves', async () => {
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Hola',
        inputTextSynonymArr: ['Hi', 'Hey'],
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(baseQuery);

      expect(mockUseCase.execute).toHaveBeenCalledWith(baseQuery);
      expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should return minimal translation data without synonyms and examples', async () => {
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Hola',
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(baseQuery);

      expect(result).toEqual({
        originalLanguageName: 'English',
        translation: 'Hola',
      });
    });

    it('should return translation with synonyms and example sentences', async () => {
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Comer',
        inputTextSynonymArr: ['Consume', 'Devour'],
        translationSynonymArr: ['Alimentarse', 'Ingerir'],
        exampleSentenceArr: [
          { sentence: 'I eat breakfast', translation: 'Yo como el desayuno' },
          { sentence: 'They eat dinner', translation: 'Ellos comen la cena' },
        ],
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const query: GetTranslationDto = { text: 'Eat', outputLanguageId: 2 };
      const result = await controller.getTranslation(query);

      expect(result).toHaveProperty('originalLanguageName', 'English');
      expect(result).toHaveProperty('translation', 'Comer');
      expect(result.inputTextSynonymArr).toHaveLength(2);
      expect(result.translationSynonymArr).toHaveLength(2);
      expect(result.exampleSentenceArr).toHaveLength(2);
    });

    it('should propagate app errors without controller translation', async () => {
      const serviceError = new ValidationAppError({ publicMessage: 'Invalid input' });
      mockUseCase.execute.mockRejectedValue(serviceError);

      await expect(controller.getTranslation(baseQuery)).rejects.toBe(serviceError);
    });

    it('should propagate unknown service errors without controller translation', async () => {
      const serviceError = new Error('Database connection failed');
      mockUseCase.execute.mockRejectedValue(serviceError);

      await expect(controller.getTranslation(baseQuery)).rejects.toBe(serviceError);
    });

    it('should handle long text translation', async () => {
      const longTextQuery: GetTranslationDto = {
        text: 'This is a very long paragraph that needs to be translated. It contains multiple sentences and should be handled properly by the service.',
        outputLanguageId: 3,
      };
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Este es un párrafo muy largo...',
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(longTextQuery);

      expect(mockUseCase.execute).toHaveBeenCalledWith(longTextQuery);
      expect(result.translation).toBeDefined();
    });

    it('should handle empty arrays for synonyms and examples', async () => {
      const mockResponse = {
        originalLanguageName: 'French',
        translation: 'Bonjour',
        inputTextSynonymArr: [],
        translationSynonymArr: [],
        exampleSentenceArr: [],
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation({ text: 'Bonjour', outputLanguageId: 1 });

      expect(result.inputTextSynonymArr).toEqual([]);
      expect(result.translationSynonymArr).toEqual([]);
      expect(result.exampleSentenceArr).toEqual([]);
    });

    it('should propagate the exact response structure from service', async () => {
      const mockResponse = {
        originalLanguageName: 'German',
        translation: 'Hallo',
        inputTextSynonymArr: ['Greetings'],
        translationSynonymArr: ['Grüß Gott'],
        exampleSentenceArr: [{ sentence: 'Hello friend', translation: 'Hallo Freund' }],
      };
      mockUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation({ text: 'Hello', outputLanguageId: 4 });

      expect(result).toEqual(mockResponse);
    });
  });
});
