import { Repository, DataSource } from 'typeorm';

import { TranslateService } from './translate.service';
import { GetTranslationDto } from './dto/get-translation.dto';

import { Language } from '../infrastructure/database/entities/language.entity';
import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';
import { LLMService } from '../infrastructure/services/llm.service';
import { ValidationAppError } from '../shared/domain/errors/validation-app-error';
import { InvalidOutputLanguageError } from './domain/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from './domain/errors/language-detection-failed.error';
import { TranslationFailedError } from './domain/errors/translation-failed.error';
import { UnsupportedInputLanguageError } from './domain/errors/unsupported-input-language.error';

describe('TranslateService', () => {
  let service: TranslateService;
  let mockLanguageRepo: jest.Mocked<Pick<Repository<Language>, 'find' | 'findOne'>>;
  let mockTranslationRepo: jest.Mocked<Pick<Repository<Translation>, 'findOne' | 'find' | 'save' | 'create'>>;
  let mockSynonymRepo: jest.Mocked<Pick<Repository<Synonym>, 'findOne' | 'save' | 'create'>>;
  let mockExampleRepo: jest.Mocked<Pick<Repository<ExampleSentence>, 'findOne' | 'save' | 'create'>>;
  let mockLLM: jest.Mocked<
    Pick<LLMService, 'determineLanguageAndCategory' | 'translateTextAndGenerateSynonyms' | 'generateSynonyms' | 'generateExampleSentences'>
  >;
  let mockDataSource: jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;

  beforeEach(() => {
    mockLanguageRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockTranslationRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockSynonymRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockExampleRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockLLM = {
      determineLanguageAndCategory: jest.fn(),
      translateTextAndGenerateSynonyms: jest.fn(),
      generateSynonyms: jest.fn(),
      generateExampleSentences: jest.fn(),
    };
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockImplementation((_, entity) => Promise.resolve({ id: 1, ...entity })),
        },
      }),
    };

    service = new TranslateService(
      mockLanguageRepo as unknown as Repository<Language>,
      mockTranslationRepo as unknown as Repository<Translation>,
      mockSynonymRepo as unknown as Repository<Synonym>,
      mockExampleRepo as unknown as Repository<ExampleSentence>,
      mockLLM as unknown as LLMService,
      mockDataSource as unknown as DataSource,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTranslation', () => {
    const baseQuery: GetTranslationDto = { text: 'hello', outputLanguageId: 2 };

    it('should throw InvalidOutputLanguageError when output language is not found', async () => {
      mockLanguageRepo.find.mockResolvedValue([]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(InvalidOutputLanguageError);
      await expect(result).rejects.toMatchObject({ code: 'INVALID_OUTPUT_LANGUAGE' });
    });

    it('should throw ValidationAppError when LLM returns errorMessage', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });
      const result = service.getTranslation({ text: 'asdfgh', outputLanguageId: 1 });

      await expect(result).rejects.toBeInstanceOf(ValidationAppError);
      await expect(result).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        publicMessage: 'Invalid input',
      });
    });

    it('should return input text when original and output language are the same', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'English' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 });

      expect(result.translation).toBe('Hello');
      expect(result.originalLanguageName).toBe('English');
    });

    it('should throw UnsupportedInputLanguageError when original language is not found in database', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'Unknown', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue(null);
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(UnsupportedInputLanguageError);
    });

    it('should throw LanguageDetectionFailedError when LLM fails to determine language and category', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue(null);
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(LanguageDetectionFailedError);
    });

    it('should return cached translation when it exists', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Sentence' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue({ output_text: 'Hola', id: 1 } as Translation);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      expect(result.translation).toBe('Hola');
      expect(result.originalLanguageName).toBe('English');
      expect(mockLLM.translateTextAndGenerateSynonyms).not.toHaveBeenCalled();
    });

    it('should return cached translation with synonyms and examples for short text', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue({ output_text: 'Hola', id: 1 } as Translation);
      mockSynonymRepo.findOne
        .mockResolvedValueOnce({ synonym_arr: ['Hi', 'Hey'] } as Synonym)
        .mockResolvedValueOnce({ synonym_arr: ['Saludo'] } as Synonym);
      mockExampleRepo.findOne.mockResolvedValue({ example_sentence_translation_id_arr: [2, 3] } as ExampleSentence);
      mockTranslationRepo.find.mockResolvedValue([
        { input_text: 'Hello world', output_text: 'Hola mundo' },
        { input_text: 'Hello friend', output_text: 'Hola amigo' },
      ] as Translation[]);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      expect(result.translation).toBe('Hola');
      expect(result.inputTextSynonymArr).toEqual(['Hi', 'Hey']);
      expect(result.translationSynonymArr).toEqual(['Saludo']);
      expect(result.exampleSentenceArr).toHaveLength(2);
    });

    it('should generate new translation via LLM when no cache exists', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue(null);

      mockLLM.translateTextAndGenerateSynonyms.mockResolvedValue({ translation: 'Hola', synonyms: ['Saludo'] });
      mockLLM.generateSynonyms.mockResolvedValue(['Hi', 'Hey']);
      mockLLM.generateExampleSentences.mockResolvedValue([{ sentence: 'Hello world', translation: 'Hola mundo' }]);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      expect(result.translation).toBe('Hola');
      expect(result.originalLanguageName).toBe('English');
      expect(result.inputTextSynonymArr).toEqual(['Hi', 'Hey']);
      expect(result.translationSynonymArr).toEqual(['Saludo']);
      expect(mockLLM.translateTextAndGenerateSynonyms).toHaveBeenCalled();
    });

    it('should throw TranslationFailedError when LLM fails to translate', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue(null);
      mockLLM.translateTextAndGenerateSynonyms.mockResolvedValue(null);
      mockLLM.generateSynonyms.mockResolvedValue(['Hi']);
      mockLLM.generateExampleSentences.mockResolvedValue([]);
      const result = service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      await expect(result).rejects.toBeInstanceOf(TranslationFailedError);
      await expect(result).rejects.toMatchObject({ code: 'TRANSLATION_FAILED' });
    });

    it('should not generate synonyms for long text (Sentence/Paragraph)', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Paragraph' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue(null);
      mockLLM.translateTextAndGenerateSynonyms.mockResolvedValue({ translation: 'Translated paragraph', synonyms: [] });
      mockLLM.generateSynonyms.mockResolvedValue([]);
      mockLLM.generateExampleSentences.mockResolvedValue([]);

      const result = await service.getTranslation({ text: 'Long paragraph text...', outputLanguageId: 2 });

      expect(result.translation).toBe('Translated paragraph');
      // generateSynonyms should be called with empty result for non-short text
      expect(mockLLM.generateSynonyms).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive language comparison', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'english' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 });

      expect(result.translation).toBe('Hello');
      expect(result.originalLanguageName).toBe('English');
    });
  });
});
