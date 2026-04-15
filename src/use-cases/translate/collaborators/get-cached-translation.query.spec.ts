import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import type { IExampleSentenceRepository } from '@/repositories/translate/i-example-sentence.repository';
import type { ISynonymRepository } from '@/repositories/translate/i-synonym.repository';
import type { ITranslationRepository } from '@/repositories/translate/i-translation.repository';
import { GetCachedTranslationQuery } from '@/use-cases/translate/collaborators/get-cached-translation.query';

describe('GetCachedTranslationQuery', () => {
  let query: GetCachedTranslationQuery;
  let mockTranslationRepository: jest.Mocked<ITranslationRepository>;
  let mockSynonymRepository: jest.Mocked<ISynonymRepository>;
  let mockExampleSentenceRepository: jest.Mocked<IExampleSentenceRepository>;

  const shortContext: ResolvedTranslationContext = {
    originalLanguageId: 1,
    originalLanguageName: 'English',
    outputLanguageId: 2,
    outputLanguageName: 'Spanish',
    isShortInputText: true,
  };

  const longContext: ResolvedTranslationContext = {
    ...shortContext,
    isShortInputText: false,
  };

  beforeEach(() => {
    mockTranslationRepository = {
      findByInputAndLanguages: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
    };
    mockSynonymRepository = {
      findByTextAndLanguage: jest.fn(),
      save: jest.fn(),
    };
    mockExampleSentenceRepository = {
      findByTextAndLanguages: jest.fn(),
      save: jest.fn(),
    };

    query = new GetCachedTranslationQuery(mockTranslationRepository, mockSynonymRepository, mockExampleSentenceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return null when the main translation is not cached', async () => {
      mockTranslationRepository.findByInputAndLanguages.mockResolvedValue(null);

      const result = await query.execute({ text: 'hello', context: shortContext });

      expect(result).toBeNull();
      expect(mockSynonymRepository.findByTextAndLanguage).not.toHaveBeenCalled();
      expect(mockExampleSentenceRepository.findByTextAndLanguages).not.toHaveBeenCalled();
    });

    it('should return the cached translation only for long text', async () => {
      mockTranslationRepository.findByInputAndLanguages.mockResolvedValue({
        id: 1,
        inputText: 'Hello world',
        inputLanguageId: 1,
        outputText: 'Hola mundo',
        outputLanguageId: 2,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      });

      const result = await query.execute({ text: 'Hello world', context: longContext });

      expect(result).toEqual({
        originalLanguageName: 'English',
        translation: 'Hola mundo',
      });
      expect(mockSynonymRepository.findByTextAndLanguage).not.toHaveBeenCalled();
      expect(mockExampleSentenceRepository.findByTextAndLanguages).not.toHaveBeenCalled();
    });

    it('should return null when any short-text cache component is missing', async () => {
      mockTranslationRepository.findByInputAndLanguages.mockResolvedValue({
        id: 1,
        inputText: 'Hello',
        inputLanguageId: 1,
        outputText: 'Hola',
        outputLanguageId: 2,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      });
      mockSynonymRepository.findByTextAndLanguage
        .mockResolvedValueOnce({ id: 1, text: 'Hello', synonymArr: ['Hi'], languageId: 1 })
        .mockResolvedValueOnce(null);
      mockExampleSentenceRepository.findByTextAndLanguages.mockResolvedValue({
        id: 1,
        text: 'Hello',
        exampleSentenceTranslationIdArr: [2],
        languageId: 1,
        outputLanguageId: 2,
      });

      const result = await query.execute({ text: 'Hello', context: shortContext });

      expect(result).toBeNull();
      expect(mockTranslationRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should return null when cached example sentence translations are incomplete', async () => {
      mockTranslationRepository.findByInputAndLanguages.mockResolvedValue({
        id: 1,
        inputText: 'Hello',
        inputLanguageId: 1,
        outputText: 'Hola',
        outputLanguageId: 2,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      });
      mockSynonymRepository.findByTextAndLanguage
        .mockResolvedValueOnce({ id: 1, text: 'Hello', synonymArr: ['Hi'], languageId: 1 })
        .mockResolvedValueOnce({ id: 2, text: 'Hola', synonymArr: ['Saludo'], languageId: 2 });
      mockExampleSentenceRepository.findByTextAndLanguages.mockResolvedValue({
        id: 1,
        text: 'Hello',
        exampleSentenceTranslationIdArr: [3, 4],
        languageId: 1,
        outputLanguageId: 2,
      });
      mockTranslationRepository.findByIds.mockResolvedValue([
        {
          id: 3,
          inputText: 'Hello world',
          inputLanguageId: 1,
          outputText: 'Hola mundo',
          outputLanguageId: 2,
          createdAt: new Date('2026-04-15T00:00:00.000Z'),
        },
      ]);

      const result = await query.execute({ text: 'Hello', context: shortContext });

      expect(result).toBeNull();
    });

    it('should return cached short-text translation with synonyms and example sentences', async () => {
      mockTranslationRepository.findByInputAndLanguages.mockResolvedValue({
        id: 1,
        inputText: 'Hello',
        inputLanguageId: 1,
        outputText: 'Hola',
        outputLanguageId: 2,
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      });
      mockSynonymRepository.findByTextAndLanguage
        .mockResolvedValueOnce({ id: 1, text: 'Hello', synonymArr: ['Hi', 'Hey'], languageId: 1 })
        .mockResolvedValueOnce({ id: 2, text: 'Hola', synonymArr: ['Saludo'], languageId: 2 });
      mockExampleSentenceRepository.findByTextAndLanguages.mockResolvedValue({
        id: 1,
        text: 'Hello',
        exampleSentenceTranslationIdArr: [3, 2],
        languageId: 1,
        outputLanguageId: 2,
      });
      mockTranslationRepository.findByIds.mockResolvedValue([
        {
          id: 3,
          inputText: 'Hello friend',
          inputLanguageId: 1,
          outputText: 'Hola amigo',
          outputLanguageId: 2,
          createdAt: new Date('2026-04-15T00:00:00.000Z'),
        },
        {
          id: 2,
          inputText: 'Hello world',
          inputLanguageId: 1,
          outputText: 'Hola mundo',
          outputLanguageId: 2,
          createdAt: new Date('2026-04-15T00:00:00.000Z'),
        },
      ]);

      const result = await query.execute({ text: 'Hello', context: shortContext });

      expect(mockTranslationRepository.findByIds).toHaveBeenCalledWith([3, 2]);
      expect(result).toEqual({
        originalLanguageName: 'English',
        inputTextSynonymArr: ['Hi', 'Hey'],
        translation: 'Hola',
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [
          { sentence: 'Hello friend', translation: 'Hola amigo' },
          { sentence: 'Hello world', translation: 'Hola mundo' },
        ],
      });
    });
  });
});
