import { BadRequestException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';

import { TranslateService } from './translate.service';
import { GetTranslationDto } from './dto/get-translation.dto';

import { Language } from '../infrastructure/database/entities/language.entity';
import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';
import { LLMService } from '../infrastructure/services/llm.service';

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

    it('should throw BadRequestException when output language is not found', async () => {
      mockLanguageRepo.find.mockResolvedValue([]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });

      await expect(service.getTranslation(baseQuery)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.getTranslation(baseQuery)).rejects.toThrow('Invalid output language');
    });

    it('should throw BadRequestException when LLM returns errorMessage', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });

      await expect(service.getTranslation({ text: 'asdfgh', outputLanguageId: 1 })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.getTranslation({ text: 'asdfgh', outputLanguageId: 1 })).rejects.toThrow('Invalid input');
    });

    it('should return input text when original and output language are the same', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'English' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);

      const result = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 });

      expect(result.translation).toBe('Hello');
      expect(result.originalLanguageName).toBe('English');
    });

    it('should throw BadRequestException when original language is not found in database', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'Unknown', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue(null);

      await expect(service.getTranslation(baseQuery)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw Error when LLM fails to determine language and category', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue(null);

      await expect(service.getTranslation(baseQuery)).rejects.toThrow('Failed to determine language and category');
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

    it('should throw Error when LLM fails to translate', async () => {
      mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }] as Language[]);
      mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
      mockLanguageRepo.findOne.mockResolvedValue({ id: 1 } as Language);
      mockTranslationRepo.findOne.mockResolvedValue(null);
      mockLLM.translateTextAndGenerateSynonyms.mockResolvedValue(null);
      mockLLM.generateSynonyms.mockResolvedValue(['Hi']);
      mockLLM.generateExampleSentences.mockResolvedValue([]);

      await expect(service.getTranslation({ text: 'Hello', outputLanguageId: 2 })).rejects.toThrow('Failed to translate text');
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
