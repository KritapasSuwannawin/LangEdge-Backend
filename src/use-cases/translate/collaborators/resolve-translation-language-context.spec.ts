import type { ILLMPort } from '@/domain/shared/ports/i-llm.port';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/domain/translate/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/domain/translate/errors/language-detection-failed.error';
import { UnsupportedInputLanguageError } from '@/domain/translate/errors/unsupported-input-language.error';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';
import { ResolveTranslationLanguageContext } from '@/use-cases/translate/collaborators/resolve-translation-language-context';

describe('ResolveTranslationLanguageContext', () => {
  let collaborator: ResolveTranslationLanguageContext;
  let mockLanguageRepository: jest.Mocked<ILanguageRepository>;
  let mockLlmPort: jest.Mocked<ILLMPort>;

  beforeEach(() => {
    mockLanguageRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
    };
    mockLlmPort = {
      determineLanguageAndCategory: jest.fn(),
      translateTextAndGenerateSynonyms: jest.fn(),
      generateSynonyms: jest.fn(),
      generateExampleSentences: jest.fn(),
    };

    collaborator = new ResolveTranslationLanguageContext(mockLanguageRepository, mockLlmPort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should throw InvalidOutputLanguageError when output language cannot be found', async () => {
      mockLanguageRepository.findById.mockResolvedValue(null);
      mockLlmPort.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });

      await expect(collaborator.execute({ text: 'hello', outputLanguageId: 1 })).rejects.toBeInstanceOf(InvalidOutputLanguageError);
    });

    it('should throw LanguageDetectionFailedError when the LLM cannot classify the text', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLlmPort.determineLanguageAndCategory.mockResolvedValue(null);

      await expect(collaborator.execute({ text: 'hello', outputLanguageId: 2 })).rejects.toBeInstanceOf(LanguageDetectionFailedError);
    });

    it('should throw ValidationAppError when the LLM marks the input as invalid', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLlmPort.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });

      await expect(collaborator.execute({ text: '%%%%', outputLanguageId: 2 })).rejects.toBeInstanceOf(ValidationAppError);
      await expect(collaborator.execute({ text: '%%%%', outputLanguageId: 2 })).rejects.toMatchObject({
        publicMessage: 'Invalid input',
        details: [{ field: 'text', message: 'Invalid input' }],
      });
    });

    it('should throw UnsupportedInputLanguageError when the detected input language is unavailable', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLlmPort.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findByName.mockResolvedValue(null);

      await expect(collaborator.execute({ text: 'hello', outputLanguageId: 2 })).rejects.toBeInstanceOf(UnsupportedInputLanguageError);
    });

    it('should resolve the language context and short-input flag when dependencies succeed', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLlmPort.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findByName.mockResolvedValue({ id: 1, name: 'English', code: 'en' });

      const result = await collaborator.execute({ text: 'hello', outputLanguageId: 2 });

      expect(result).toEqual({
        originalLanguageId: 1,
        originalLanguageName: 'English',
        outputLanguageId: 2,
        outputLanguageName: 'Spanish',
        isShortInputText: true,
      });
    });
  });
});
