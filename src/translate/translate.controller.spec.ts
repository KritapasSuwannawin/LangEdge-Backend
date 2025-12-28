import { InternalServerErrorException } from '@nestjs/common';

import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';
import { GetTranslationDto } from './dto/get-translation.dto';

describe('TranslateController', () => {
  let controller: TranslateController;
  let mockService: jest.Mocked<Pick<TranslateService, 'getTranslation'>>;

  beforeEach(() => {
    mockService = {
      getTranslation: jest.fn(),
    };
    controller = new TranslateController(mockService as unknown as TranslateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTranslation', () => {
    const baseQuery: GetTranslationDto = { text: 'Hello', outputLanguageId: 2 };

    it('should return translation wrapped in data object when service resolves', async () => {
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Hola',
        inputTextSynonymArr: ['Hi', 'Hey'],
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
      };
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(baseQuery);

      expect(mockService.getTranslation).toHaveBeenCalledWith(baseQuery);
      expect(mockService.getTranslation).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: mockResponse });
    });

    it('should return minimal translation data without synonyms and examples', async () => {
      const mockResponse = {
        originalLanguageName: 'English',
        translation: 'Hola',
      };
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(baseQuery);

      expect(result).toEqual({
        data: {
          originalLanguageName: 'English',
          translation: 'Hola',
        },
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
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const query: GetTranslationDto = { text: 'Eat', outputLanguageId: 2 };
      const result = await controller.getTranslation(query);

      expect(result.data).toHaveProperty('originalLanguageName', 'English');
      expect(result.data).toHaveProperty('translation', 'Comer');
      expect(result.data.inputTextSynonymArr).toHaveLength(2);
      expect(result.data.translationSynonymArr).toHaveLength(2);
      expect(result.data.exampleSentenceArr).toHaveLength(2);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      mockService.getTranslation.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(controller.getTranslation(baseQuery)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.getTranslation(baseQuery)).rejects.toThrow('Internal server error');
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
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation(longTextQuery);

      expect(mockService.getTranslation).toHaveBeenCalledWith(longTextQuery);
      expect(result.data.translation).toBeDefined();
    });

    it('should handle empty arrays for synonyms and examples', async () => {
      const mockResponse = {
        originalLanguageName: 'French',
        translation: 'Bonjour',
        inputTextSynonymArr: [],
        translationSynonymArr: [],
        exampleSentenceArr: [],
      };
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation({ text: 'Bonjour', outputLanguageId: 1 });

      expect(result.data.inputTextSynonymArr).toEqual([]);
      expect(result.data.translationSynonymArr).toEqual([]);
      expect(result.data.exampleSentenceArr).toEqual([]);
    });

    it('should propagate the exact response structure from service', async () => {
      const mockResponse = {
        originalLanguageName: 'German',
        translation: 'Hallo',
        inputTextSynonymArr: ['Greetings'],
        translationSynonymArr: ['Grüß Gott'],
        exampleSentenceArr: [{ sentence: 'Hello friend', translation: 'Hallo Freund' }],
      };
      mockService.getTranslation.mockResolvedValue(mockResponse);

      const result = await controller.getTranslation({ text: 'Hello', outputLanguageId: 4 });

      expect(result.data).toEqual(mockResponse);
    });
  });
});
