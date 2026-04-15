import type { ILLMPort } from '@/domain/shared/ports/i-llm.port';
import { TranslationFailedError } from '@/domain/translate/errors/translation-failed.error';
import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import { GenerateTranslationArtifacts } from '@/use-cases/translate/collaborators/generate-translation-artifacts';

describe('GenerateTranslationArtifacts', () => {
  let collaborator: GenerateTranslationArtifacts;
  let mockLlmPort: jest.Mocked<ILLMPort>;

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
    mockLlmPort = {
      determineLanguageAndCategory: jest.fn(),
      translateTextAndGenerateSynonyms: jest.fn(),
      generateSynonyms: jest.fn(),
      generateExampleSentences: jest.fn(),
    };

    collaborator = new GenerateTranslationArtifacts(mockLlmPort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should generate short-text artifacts and normalize nullable arrays', async () => {
      mockLlmPort.translateTextAndGenerateSynonyms.mockResolvedValue({
        translation: 'Hola',
        synonyms: ['Saludo'],
      });
      mockLlmPort.generateSynonyms.mockResolvedValue(null);
      mockLlmPort.generateExampleSentences.mockResolvedValue(null);

      const result = await collaborator.execute({ text: 'Hello', context: shortContext });

      expect(mockLlmPort.translateTextAndGenerateSynonyms).toHaveBeenCalledWith('Hello', true, 'English', 'Spanish');
      expect(mockLlmPort.generateSynonyms).toHaveBeenCalledWith('Hello', 'English');
      expect(mockLlmPort.generateExampleSentences).toHaveBeenCalledWith('Hello', 'English', 'Spanish');
      expect(result).toEqual({
        translation: 'Hola',
        inputTextSynonymArr: [],
        translationSynonymArr: ['Saludo'],
        exampleSentenceArr: [],
      });
    });

    it('should skip supplemental generation for long text', async () => {
      mockLlmPort.translateTextAndGenerateSynonyms.mockResolvedValue({
        translation: 'Texto traducido',
        synonyms: [],
      });

      const result = await collaborator.execute({ text: 'Long paragraph', context: longContext });

      expect(mockLlmPort.generateSynonyms).not.toHaveBeenCalled();
      expect(mockLlmPort.generateExampleSentences).not.toHaveBeenCalled();
      expect(result).toEqual({
        translation: 'Texto traducido',
        inputTextSynonymArr: [],
        translationSynonymArr: [],
        exampleSentenceArr: [],
      });
    });

    it('should throw TranslationFailedError when the main translation call returns null', async () => {
      mockLlmPort.translateTextAndGenerateSynonyms.mockResolvedValue(null);
      mockLlmPort.generateSynonyms.mockResolvedValue(['Hi']);
      mockLlmPort.generateExampleSentences.mockResolvedValue([]);

      await expect(collaborator.execute({ text: 'Hello', context: shortContext })).rejects.toBeInstanceOf(TranslationFailedError);
    });
  });
});
