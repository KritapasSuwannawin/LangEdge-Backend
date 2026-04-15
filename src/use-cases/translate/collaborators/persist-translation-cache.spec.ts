import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import type { ITranslationCacheWriter } from '@/repositories/translate/i-translation-cache-writer';
import * as systemUtils from '@/shared/utils/systemUtils';
import { PersistTranslationCache } from '@/use-cases/translate/collaborators/persist-translation-cache';

describe('PersistTranslationCache', () => {
  let collaborator: PersistTranslationCache;
  let mockTranslationCacheWriter: jest.Mocked<ITranslationCacheWriter>;

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
    mockTranslationCacheWriter = {
      saveShortTranslationCache: jest.fn(),
    };

    collaborator = new PersistTranslationCache(mockTranslationCacheWriter);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    it('should skip cache persistence for long text', async () => {
      await collaborator.execute({
        text: 'Long paragraph',
        context: longContext,
        artifacts: {
          translation: 'Texto largo',
          inputTextSynonymArr: ['Lengthy'],
          translationSynonymArr: ['Extenso'],
          exampleSentenceArr: [{ sentence: 'Long paragraph', translation: 'Texto largo' }],
        },
      });

      expect(mockTranslationCacheWriter.saveShortTranslationCache).not.toHaveBeenCalled();
    });

    it('should skip cache persistence when short-text artifacts are incomplete', async () => {
      await collaborator.execute({
        text: 'Hello',
        context: shortContext,
        artifacts: {
          translation: 'Hola',
          inputTextSynonymArr: [],
          translationSynonymArr: ['Saludo'],
          exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
        },
      });

      expect(mockTranslationCacheWriter.saveShortTranslationCache).not.toHaveBeenCalled();
    });

    it('should persist complete short-text cache data', async () => {
      mockTranslationCacheWriter.saveShortTranslationCache.mockResolvedValue(undefined);

      await collaborator.execute({
        text: 'Hello',
        context: shortContext,
        artifacts: {
          translation: 'Hola',
          inputTextSynonymArr: ['Hi', 'Hey'],
          translationSynonymArr: ['Saludo'],
          exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
        },
      });

      expect(mockTranslationCacheWriter.saveShortTranslationCache).toHaveBeenCalledWith({
        inputText: 'Hello',
        inputLanguageId: 1,
        outputText: 'Hola',
        outputLanguageId: 2,
        inputTextSynonymArr: ['Hi', 'Hey'],
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
      });
    });

    it('should log and swallow cache writer failures', async () => {
      const logErrorSpy = jest.spyOn(systemUtils, 'logError').mockImplementation(() => undefined);
      mockTranslationCacheWriter.saveShortTranslationCache.mockRejectedValue(new Error('writer failed'));

      await expect(
        collaborator.execute({
          text: 'Hello',
          context: shortContext,
          artifacts: {
            translation: 'Hola',
            inputTextSynonymArr: ['Hi'],
            translationSynonymArr: ['Saludo'],
            exampleSentenceArr: [{ sentence: 'Hello world', translation: 'Hola mundo' }],
          },
        }),
      ).resolves.toBeUndefined();

      expect(logErrorSpy).toHaveBeenCalledWith('PersistTranslationCache.execute', expect.any(Error), {
        inputLanguageId: 1,
        outputLanguageId: 2,
      });
    });
  });
});
