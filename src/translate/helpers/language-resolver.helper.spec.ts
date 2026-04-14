import { Repository } from 'typeorm';

import { Language } from '@/infrastructure/database/entities/language.entity';
import { LLMService } from '@/infrastructure/services/llm.service';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/domain/translate/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/domain/translate/errors/language-detection-failed.error';
import { UnsupportedInputLanguageError } from '@/domain/translate/errors/unsupported-input-language.error';
import { LanguageResolverHelper } from '@/translate/helpers/language-resolver.helper';

describe('LanguageResolverHelper', () => {
  let helper: LanguageResolverHelper;
  let mockLanguageRepo: jest.Mocked<Pick<Repository<Language>, 'find' | 'findOne'>>;
  let mockLlmService: jest.Mocked<Pick<LLMService, 'determineLanguageAndCategory'>>;

  beforeEach(() => {
    mockLanguageRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockLlmService = {
      determineLanguageAndCategory: jest.fn(),
    };

    helper = new LanguageResolverHelper(mockLanguageRepo as unknown as Repository<Language>, mockLlmService as unknown as LLMService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveLanguageContext', () => {
    it('should throw InvalidOutputLanguageError when output language cannot be found', async () => {
      mockLanguageRepo.find.mockResolvedValue([]);
      mockLlmService.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });

      await expect(helper.resolveLanguageContext('hello', 1)).rejects.toBeInstanceOf(InvalidOutputLanguageError);
    });

    it('should throw LanguageDetectionFailedError when the LLM cannot classify the text', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLlmService.determineLanguageAndCategory.mockResolvedValue(null);

      await expect(helper.resolveLanguageContext('hello', 2)).rejects.toBeInstanceOf(LanguageDetectionFailedError);
    });

    it('should throw ValidationAppError when the LLM marks the input as invalid', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLlmService.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });

      await expect(helper.resolveLanguageContext('%%%%', 2)).rejects.toBeInstanceOf(ValidationAppError);
      await expect(helper.resolveLanguageContext('%%%%', 2)).rejects.toMatchObject({
        publicMessage: 'Invalid input',
        details: [{ field: 'text', message: 'Invalid input' }],
      });
    });

    it('should throw UnsupportedInputLanguageError when the detected input language is unavailable', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLlmService.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue(null);

      await expect(helper.resolveLanguageContext('hello', 2)).rejects.toBeInstanceOf(UnsupportedInputLanguageError);
    });

    it('should resolve language context and short-input flag when dependencies succeed', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLlmService.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);

      const result = await helper.resolveLanguageContext('hello', 2);

      expect(result).toEqual({
        languageContext: {
          originalLanguageId: 1,
          originalLanguageName: 'English',
          outputLanguageId: 2,
          outputLanguageName: 'Spanish',
        },
        isShortInputText: true,
      });
    });
  });
});
