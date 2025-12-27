import { BadRequestException } from '@nestjs/common';
import { TranslateService } from './translate.service';

describe('TranslateService', () => {
  let service: TranslateService;
  const mockLanguageRepo: any = { find: jest.fn(), findOne: jest.fn() };
  const mockTranslationRepo: any = { findOne: jest.fn(), find: jest.fn(), save: jest.fn(), create: jest.fn() };
  const mockSynonymRepo: any = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const mockExampleRepo: any = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const mockLLM: any = {
    determineLanguageAndCategory: jest.fn(),
    translateTextAndGenerateSynonyms: jest.fn(),
    generateSynonyms: jest.fn(),
    generateExampleSentences: jest.fn(),
  };

  beforeEach(() => {
    mockLanguageRepo.find.mockReset();
    mockLanguageRepo.findOne.mockReset();
    mockTranslationRepo.findOne.mockReset();
    mockTranslationRepo.find.mockReset();
    mockSynonymRepo.findOne.mockReset();
    mockExampleRepo.findOne.mockReset();
    mockLLM.determineLanguageAndCategory.mockReset();
    mockLLM.translateTextAndGenerateSynonyms.mockReset();
    mockLLM.generateSynonyms.mockReset();
    mockLLM.generateExampleSentences.mockReset();

    service = new TranslateService(
      mockLanguageRepo as any,
      mockTranslationRepo as any,
      mockSynonymRepo as any,
      mockExampleRepo as any,
      mockLLM as any,
    );
  });

  test('getTranslation throws BadRequest when output language not found', async () => {
    mockLanguageRepo.find.mockResolvedValue([]);
    mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });

    await expect(service.getTranslation({ text: 'hello', outputLanguageId: 99 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('getTranslation throws BadRequest when LLM returns errorMessage', async () => {
    mockLanguageRepo.find.mockResolvedValue([{ name: 'Spanish' }]);
    mockLLM.determineLanguageAndCategory.mockResolvedValue({ errorMessage: 'Invalid input' });

    await expect(service.getTranslation({ text: 'xxx', outputLanguageId: 1 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('getTranslation returns input text when original and output language are the same', async () => {
    mockLanguageRepo.find.mockResolvedValue([{ name: 'English' }]);
    mockLLM.determineLanguageAndCategory.mockResolvedValue({ language: 'English', category: 'Word' });
    mockLanguageRepo.findOne.mockResolvedValue({ id: 1 });

    const res = await service.getTranslation({ text: 'Hello', outputLanguageId: 1 } as any);
    expect(res.translation).toBe('Hello');
    expect(res.originalLanguageName).toBe('English');
  });
});
