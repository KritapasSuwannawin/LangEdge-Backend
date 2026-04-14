import { Repository, DataSource } from 'typeorm';

import { TranslateService } from './translate.service';
import { GetTranslationDto } from '@/controllers/translate/dto/get-translation.dto';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';

import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';
import { LLMService } from '../infrastructure/services/llm.service';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/domain/translate/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/domain/translate/errors/language-detection-failed.error';
import { TranslationFailedError } from '@/domain/translate/errors/translation-failed.error';
import { UnsupportedInputLanguageError } from '@/domain/translate/errors/unsupported-input-language.error';

describe('TranslateService', () => {
  let service: TranslateService;
  let mockLanguageRepository: jest.Mocked<ILanguageRepository>;
  let mockTranslationRepo: jest.Mocked<Pick<Repository<Translation>, 'findOne' | 'find' | 'save' | 'create'>>;
  let mockSynonymRepo: jest.Mocked<Pick<Repository<Synonym>, 'findOne' | 'save' | 'create'>>;
  let mockExampleRepo: jest.Mocked<Pick<Repository<ExampleSentence>, 'findOne' | 'save' | 'create'>>;
  let mockLLM: jest.Mocked<
    Pick<LLMService, 'determineLanguageAndCategory' | 'translateTextAndGenerateSynonyms' | 'generateSynonyms' | 'generateExampleSentences'>
  >;
  let mockDataSource: jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;

  beforeEach(() => {
    mockLanguageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
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
      mockLanguageRepository,
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
      mockLanguageRepository.findById.mockResolvedValue(null);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(InvalidOutputLanguageError);
      await expect(result).rejects.toMatchObject({ code: 'INVALID_OUTPUT_LANGUAGE' });
    });

    it('should throw ValidationAppError when LLM returns errorMessage', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 1, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });
      const result = service.getTranslation({ text: 'asdfgh', outputLanguageId: 1 });

      await expect(result).rejects.toBeInstanceOf(ValidationAppError);
      await expect(result).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        publicMessage: 'Invalid input',
      });
    });

    it('should return input text when original and output language are the same', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 1, name: 'English', code: 'en' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([{ id: 1, name: 'English', code: 'en' }]);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 });

      expect(result.translation).toBe('Hello');
      expect(result.originalLanguageName).toBe('English');
    });

    it('should throw UnsupportedInputLanguageError when original language is not found in database', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'Unknown', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([{ id: 2, name: 'Spanish', code: 'es' }]);
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(UnsupportedInputLanguageError);
    });

    it('should throw LanguageDetectionFailedError when LLM fails to determine language and category', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue(null);
      const result = service.getTranslation(baseQuery);

      await expect(result).rejects.toBeInstanceOf(LanguageDetectionFailedError);
    });

    it('should return cached translation when it exists', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Sentence' });
      mockLanguageRepository.findAll.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ]);
      mockTranslationRepo.findOne.mockResolvedValue({ output_text: 'Hola', id: 1 } as Translation);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      expect(result.translation).toBe('Hola');
      expect(result.originalLanguageName).toBe('English');
      expect(mockLLM.translateTextAndGenerateSynonyms).not.toHaveBeenCalled();
    });

    it('should return cached translation with synonyms and examples for short text', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ]);
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
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ]);
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
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ]);
      mockTranslationRepo.findOne.mockResolvedValue(null);
      mockLLM.translateTextAndGenerateSynonyms.mockResolvedValue(null);
      mockLLM.generateSynonyms.mockResolvedValue(['Hi']);
      mockLLM.generateExampleSentences.mockResolvedValue([]);
      const result = service.getTranslation({ text: 'Hello', outputLanguageId: 2 });

      await expect(result).rejects.toBeInstanceOf(TranslationFailedError);
      await expect(result).rejects.toMatchObject({ code: 'TRANSLATION_FAILED' });
    });

    it('should not generate synonyms for long text (Sentence/Paragraph)', async () => {
      mockLanguageRepository.findById.mockResolvedValue({ id: 2, name: 'Spanish', code: 'es' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Paragraph' });
      mockLanguageRepository.findAll.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ]);
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
      mockLanguageRepository.findById.mockResolvedValue({ id: 1, name: 'english', code: 'en' });
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepository.findAll.mockResolvedValue([{ id: 1, name: 'English', code: 'en' }]);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 });

      expect(result.translation).toBe('Hello');
      expect(result.originalLanguageName).toBe('English');
    });
  });
});
