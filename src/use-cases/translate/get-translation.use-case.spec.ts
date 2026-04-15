import type { GeneratedTranslationArtifacts } from '@/domain/translate/generated-translation-artifacts';
import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import { GenerateTranslationArtifacts } from '@/use-cases/translate/collaborators/generate-translation-artifacts';
import { GetCachedTranslationQuery } from '@/use-cases/translate/collaborators/get-cached-translation.query';
import { PersistTranslationCache } from '@/use-cases/translate/collaborators/persist-translation-cache';
import { ResolveTranslationLanguageContext } from '@/use-cases/translate/collaborators/resolve-translation-language-context';
import { GetTranslationUseCase } from '@/use-cases/translate/get-translation.use-case';

describe('GetTranslationUseCase', () => {
  let useCase: GetTranslationUseCase;
  let mockResolveTranslationLanguageContext: jest.Mocked<Pick<ResolveTranslationLanguageContext, 'execute'>>;
  let mockGetCachedTranslationQuery: jest.Mocked<Pick<GetCachedTranslationQuery, 'execute'>>;
  let mockGenerateTranslationArtifacts: jest.Mocked<Pick<GenerateTranslationArtifacts, 'execute'>>;
  let mockPersistTranslationCache: jest.Mocked<Pick<PersistTranslationCache, 'execute'>>;

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

  const shortArtifacts: GeneratedTranslationArtifacts = {
    translation: 'Hola',
    inputTextSynonymArr: ['Hi', 'Hey'],
    translationSynonymArr: ['Saludo'],
    exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
  };

  beforeEach(() => {
    mockResolveTranslationLanguageContext = {
      execute: jest.fn(),
    };
    mockGetCachedTranslationQuery = {
      execute: jest.fn(),
    };
    mockGenerateTranslationArtifacts = {
      execute: jest.fn(),
    };
    mockPersistTranslationCache = {
      execute: jest.fn(),
    };

    useCase = new GetTranslationUseCase(
      mockResolveTranslationLanguageContext as unknown as ResolveTranslationLanguageContext,
      mockGetCachedTranslationQuery as unknown as GetCachedTranslationQuery,
      mockGenerateTranslationArtifacts as unknown as GenerateTranslationArtifacts,
      mockPersistTranslationCache as unknown as PersistTranslationCache,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should short-circuit when the input and output languages match case-insensitively', async () => {
      mockResolveTranslationLanguageContext.execute.mockResolvedValue({
        ...shortContext,
        outputLanguageName: 'english',
      });

      const result = await useCase.execute({ text: 'Hello', outputLanguageId: 1 });

      expect(result).toEqual({
        originalLanguageName: 'English',
        translation: 'Hello',
      });
      expect(mockGetCachedTranslationQuery.execute).not.toHaveBeenCalled();
      expect(mockGenerateTranslationArtifacts.execute).not.toHaveBeenCalled();
      expect(mockPersistTranslationCache.execute).not.toHaveBeenCalled();
    });

    it('should return the cached translation when one exists', async () => {
      mockResolveTranslationLanguageContext.execute.mockResolvedValue(shortContext);
      mockGetCachedTranslationQuery.execute.mockResolvedValue({
        originalLanguageName: 'English',
        translation: 'Hola',
        inputTextSynonymArr: ['Hi'],
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
      });

      const result = await useCase.execute({ text: 'Hello', outputLanguageId: 2 });

      expect(result.translation).toBe('Hola');
      expect(mockGenerateTranslationArtifacts.execute).not.toHaveBeenCalled();
      expect(mockPersistTranslationCache.execute).not.toHaveBeenCalled();
    });

    it('should generate and persist short-text artifacts on a cache miss', async () => {
      mockResolveTranslationLanguageContext.execute.mockResolvedValue(shortContext);
      mockGetCachedTranslationQuery.execute.mockResolvedValue(null);
      mockGenerateTranslationArtifacts.execute.mockResolvedValue(shortArtifacts);
      mockPersistTranslationCache.execute.mockResolvedValue(undefined);

      const result = await useCase.execute({ text: 'Hello', outputLanguageId: 2 });

      expect(mockGetCachedTranslationQuery.execute).toHaveBeenCalledWith({ text: 'Hello', context: shortContext });
      expect(mockGenerateTranslationArtifacts.execute).toHaveBeenCalledWith({ text: 'Hello', context: shortContext });
      expect(mockPersistTranslationCache.execute).toHaveBeenCalledWith({
        text: 'Hello',
        context: shortContext,
        artifacts: shortArtifacts,
      });
      expect(result).toEqual({
        originalLanguageName: 'English',
        inputTextSynonymArr: ['Hi', 'Hey'],
        translation: 'Hola',
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
      });
    });

    it('should omit short-text extras from the final output for long text', async () => {
      mockResolveTranslationLanguageContext.execute.mockResolvedValue(longContext);
      mockGetCachedTranslationQuery.execute.mockResolvedValue(null);
      mockGenerateTranslationArtifacts.execute.mockResolvedValue({
        translation: 'Texto traducido',
        inputTextSynonymArr: [],
        translationSynonymArr: [],
        exampleSentenceArr: [],
      });
      mockPersistTranslationCache.execute.mockResolvedValue(undefined);

      const result = await useCase.execute({ text: 'Long paragraph', outputLanguageId: 2 });

      expect(result).toEqual({
        originalLanguageName: 'English',
        translation: 'Texto traducido',
      });
    });
  });
});
