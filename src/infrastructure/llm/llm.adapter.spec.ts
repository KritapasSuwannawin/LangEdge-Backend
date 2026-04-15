import { logError, logInfo } from '@/shared/utils/systemUtils';
import { getLLM } from '@/infrastructure/llm/models';
import type { LLM } from '@/infrastructure/llm/models/llm.interface';

import { LLMAdapter } from '@/infrastructure/llm/llm.adapter';

type MockLlm = {
  call: jest.MockedFunction<Pick<LLM, 'call'>['call']>;
};

jest.mock('@/infrastructure/llm/models', () => ({
  getLLM: jest.fn(),
}));

jest.mock('@/shared/utils/systemUtils', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('LLMAdapter', () => {
  let adapter: LLMAdapter;
  let mockLlm: MockLlm;

  beforeEach(() => {
    mockLlm = {
      call: jest.fn(),
    };
    jest.mocked(getLLM).mockReturnValue(mockLlm as unknown as ReturnType<typeof getLLM>);

    adapter = new LLMAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determineLanguageAndCategory', () => {
    it('should return the parsed language and category from the LLM response', async () => {
      mockLlm.call.mockResolvedValue({
        output: { language: 'English', category: 'Word' },
      });

      const result = await adapter.determineLanguageAndCategory('Hello');
      const prompt = mockLlm.call.mock.calls[0]?.[0];

      if (!prompt) {
        throw new Error('Expected determineLanguageAndCategory to call the LLM');
      }

      expect(result).toEqual({ language: 'English', category: 'Word' });
      expect(prompt[0]?.content).toContain('Determine the language of the input text');
      expect(prompt[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(logInfo).toHaveBeenCalledWith('llm.determineLanguageAndCategory', 'Received structured LLM response', {
        isValidInput: true,
        language: 'English',
        category: 'Word',
      });
    });

    it('should return null and log an error when the LLM call fails', async () => {
      const error = new Error('LLM unavailable');
      mockLlm.call.mockRejectedValue(error);

      const result = await adapter.determineLanguageAndCategory('Hello');

      expect(result).toBeNull();
      expect(logError).toHaveBeenCalledWith('llm.determineLanguageAndCategory', error);
    });
  });

  describe('translateTextAndGenerateSynonyms', () => {
    it('should include synonyms when requested', async () => {
      mockLlm.call.mockResolvedValue({
        translation: 'Hola',
        synonyms: ['Saludos', 'Buenas', 'Qué tal'],
      });

      const result = await adapter.translateTextAndGenerateSynonyms('Hello', true, 'English', 'Spanish');
      const prompt = mockLlm.call.mock.calls[0]?.[0];

      if (!prompt) {
        throw new Error('Expected translateTextAndGenerateSynonyms to call the LLM');
      }

      expect(result).toEqual({
        translation: 'Hola',
        synonyms: ['Saludos', 'Buenas', 'Qué tal'],
      });
      expect(prompt[0]?.content).toContain('Generate 3-5 synonyms for the translated text in Spanish.');
    });

    it('should normalize a translation-only response into an empty synonym array', async () => {
      mockLlm.call.mockResolvedValue({
        translation: 'Hola',
      });

      const result = await adapter.translateTextAndGenerateSynonyms('Hello', false, 'English', 'Spanish');
      const prompt = mockLlm.call.mock.calls[0]?.[0];

      if (!prompt) {
        throw new Error('Expected translateTextAndGenerateSynonyms to call the LLM');
      }

      expect(result).toEqual({
        translation: 'Hola',
        synonyms: [],
      });
      expect(prompt[0]?.content).not.toContain('Generate 3-5 synonyms');
    });
  });

  describe('generateSynonyms', () => {
    it('should return synonyms from the structured LLM output', async () => {
      mockLlm.call.mockResolvedValue({
        output: { synonyms: ['happy', 'joyful', 'content'] },
      });

      const result = await adapter.generateSynonyms('feliz', 'Spanish');

      expect(result).toEqual(['happy', 'joyful', 'content']);
      expect(logInfo).toHaveBeenCalledWith('llm.generateSynonyms', 'Received structured LLM response', {
        synonymCount: 3,
        language: 'Spanish',
      });
    });
  });

  describe('generateExampleSentences', () => {
    it('should return example sentences from the structured LLM output', async () => {
      mockLlm.call.mockResolvedValue({
        output: [
          { sentence: 'I am happy.', translation: 'Estoy feliz.' },
          { sentence: 'She feels happy.', translation: 'Ella se siente feliz.' },
          { sentence: 'They stayed happy.', translation: 'Ellos siguieron felices.' },
        ],
      });

      const result = await adapter.generateExampleSentences('happy', 'English', 'Spanish');
      const prompt = mockLlm.call.mock.calls[0]?.[0];

      if (!prompt) {
        throw new Error('Expected generateExampleSentences to call the LLM');
      }

      expect(result).toEqual([
        { sentence: 'I am happy.', translation: 'Estoy feliz.' },
        { sentence: 'She feels happy.', translation: 'Ella se siente feliz.' },
        { sentence: 'They stayed happy.', translation: 'Ellos siguieron felices.' },
      ]);
      expect(prompt[0]?.content).toContain('Generate 3 example sentences for the input text in English.');
      expect(prompt[0]?.content).toContain('Translate each example sentence into Spanish.');
    });
  });
});
