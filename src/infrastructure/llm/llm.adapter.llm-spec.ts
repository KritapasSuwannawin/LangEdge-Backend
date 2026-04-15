import 'dotenv/config';

import { getLLM } from '@/infrastructure/llm/models';
import type { LLM } from '@/infrastructure/llm/models/llm.interface';

import { LLMAdapter } from '@/infrastructure/llm/llm.adapter';

describe('LLMAdapter (live LLM)', () => {
  let adapter: LLMAdapter;
  let defaultLLM: LLM;

  beforeEach(() => {
    jest.restoreAllMocks();
    adapter = new LLMAdapter();
    defaultLLM = getLLM();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  jest.setTimeout(10000);

  describe('determineLanguageAndCategory', () => {
    it('should identify a single word in English', async () => {
      const result = await adapter.determineLanguageAndCategory('Hello');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('language', 'English');
      expect(result).toHaveProperty('category', 'Word');
    });

    it('should identify a phrase in English', async () => {
      const result = await adapter.determineLanguageAndCategory('A little boy');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('language', 'English');
      expect(result).toHaveProperty('category', 'Phrase');
    });

    it('should identify a sentence in English', async () => {
      const result = await adapter.determineLanguageAndCategory('The quick brown fox jumps over the lazy dog.');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('language', 'English');
      expect(result).toHaveProperty('category', 'Sentence');
    });

    it('should identify a paragraph in English', async () => {
      const result = await adapter.determineLanguageAndCategory(
        'Language learning is a journey. It requires patience and consistent practice. Many people find it challenging, but the rewards of being able to communicate in another language make it worthwhile.',
      );

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('language', 'English');
      expect(result).toHaveProperty('category', 'Paragraph');
    });

    it('should identify text in a non-English language', async () => {
      const result = await adapter.determineLanguageAndCategory('Bonjour');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('language', 'French');
      expect(result).toHaveProperty('category', 'Word');
    });

    it('should return an error for meaningless input', async () => {
      const result = await adapter.determineLanguageAndCategory('asdfghjkl qwertyuiop zxcvbnm');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('errorMessage', 'Invalid input');
    });

    it('should return an error for random characters', async () => {
      const result = await adapter.determineLanguageAndCategory('!@#$%^&*()_+');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('errorMessage', 'Invalid input');
    });

    it('should handle empty string input', async () => {
      const result = await adapter.determineLanguageAndCategory('');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('errorMessage', 'Invalid input');
    });

    it('should return null when an error occurs', async () => {
      jest.spyOn(defaultLLM, 'call').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await adapter.determineLanguageAndCategory('Hello', defaultLLM);

      expect(result).toBeNull();
    });
  });

  describe('translateTextAndGenerateSynonyms', () => {
    it('should translate text from English to Spanish without synonyms', async () => {
      const result = await adapter.translateTextAndGenerateSynonyms('Eat', false, 'English', 'Spanish');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('translation');
      expect(typeof result?.translation).toBe('string');
      expect(result).toHaveProperty('synonyms');
      expect(Array.isArray(result?.synonyms)).toBe(true);
      expect(result?.synonyms.length).toBe(0);
    });

    it('should translate text from English to Spanish with synonyms', async () => {
      const result = await adapter.translateTextAndGenerateSynonyms('Eat', true, 'English', 'Spanish');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('translation');
      expect(typeof result?.translation).toBe('string');
      expect(result).toHaveProperty('synonyms');
      expect(Array.isArray(result?.synonyms)).toBe(true);
      expect(result?.synonyms.length).toBeGreaterThanOrEqual(3);
      expect(result?.synonyms.length).toBeLessThanOrEqual(5);
    });

    it('should translate from Spanish to English without synonyms', async () => {
      const result = await adapter.translateTextAndGenerateSynonyms('comer', false, 'Spanish', 'English');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('translation');
      expect(typeof result?.translation).toBe('string');
      expect(result).toHaveProperty('synonyms');
      expect(Array.isArray(result?.synonyms)).toBe(true);
      expect(result?.synonyms.length).toBe(0);
    });

    it('should translate from Spanish to English with synonyms', async () => {
      const result = await adapter.translateTextAndGenerateSynonyms('comer', true, 'Spanish', 'English');

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('translation');
      expect(typeof result?.translation).toBe('string');
      expect(result).toHaveProperty('synonyms');
      expect(Array.isArray(result?.synonyms)).toBe(true);
      expect(result?.synonyms.length).toBeGreaterThanOrEqual(3);
      expect(result?.synonyms.length).toBeLessThanOrEqual(5);
    });

    it('should return null when an error occurs', async () => {
      jest.spyOn(defaultLLM, 'call').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await adapter.translateTextAndGenerateSynonyms('Hello', false, 'English', 'Spanish', defaultLLM);

      expect(result).toBeNull();
    });
  });

  describe('generateSynonyms', () => {
    it('should generate synonyms for an English word', async () => {
      const result = await adapter.generateSynonyms('Happy', 'English');

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBeGreaterThanOrEqual(3);
      expect(result?.length).toBeLessThanOrEqual(5);
    });

    it('should generate synonyms for a non-English word', async () => {
      const result = await adapter.generateSynonyms('heureux', 'French');

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBeGreaterThanOrEqual(3);
      expect(result?.length).toBeLessThanOrEqual(5);
    });

    it('should return null when an error occurs', async () => {
      jest.spyOn(defaultLLM, 'call').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await adapter.generateSynonyms('Happy', 'English', defaultLLM);

      expect(result).toBeNull();
    });
  });

  describe('generateExampleSentences', () => {
    it('should generate example sentences from English to Spanish', async () => {
      const result = await adapter.generateExampleSentences('happy', 'English', 'Spanish');

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(3);
      result?.forEach((item) => {
        expect(item).toHaveProperty('sentence');
        expect(typeof item.sentence).toBe('string');
        expect(item.sentence.length).toBeGreaterThan(0);
        expect(item).toHaveProperty('translation');
        expect(typeof item.translation).toBe('string');
        expect(item.translation.length).toBeGreaterThan(0);
      });
    });

    it('should generate example sentences from Spanish to English', async () => {
      const result = await adapter.generateExampleSentences('feliz', 'Spanish', 'English');
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBe(3);
      result!.forEach((item) => {
        expect(item).toHaveProperty('sentence');
        expect(typeof item.sentence).toBe('string');
        expect(item.sentence.length).toBeGreaterThan(0);

        expect(item).toHaveProperty('translation');
        expect(typeof item.translation).toBe('string');
        expect(item.translation.length).toBeGreaterThan(0);
      });
    });

    it('should return null when an error occurs', async () => {
      jest.spyOn(defaultLLM, 'call').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await adapter.generateExampleSentences('happy', 'English', 'Spanish', defaultLLM);

      expect(result).toBeNull();
    });
  });
});
