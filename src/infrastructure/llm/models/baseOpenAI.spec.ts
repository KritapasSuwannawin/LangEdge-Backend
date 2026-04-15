import { z } from 'zod';

import { logError, logWarn } from '@/shared/utils/systemUtils';

import BaseOpenAI from '@/infrastructure/llm/models/baseOpenAI';

type LlmResponse = Record<string, unknown>;
type PromptMessage = { role: 'user' | 'system'; content: string };

const mockStream = jest.fn();
const mockWithStructuredOutput = jest.fn();
const mockGetNumTokens = jest.fn();

const mockChatOpenAIInstance = {
  getNumTokens: mockGetNumTokens,
  withStructuredOutput: mockWithStructuredOutput,
};

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => mockChatOpenAIInstance),
}));

jest.mock('@/shared/utils/systemUtils', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

const createAsyncStream = (chunks: LlmResponse[]): AsyncGenerator<LlmResponse, void, void> => {
  async function* generator(): AsyncGenerator<LlmResponse, void, void> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  return generator();
};

describe('BaseOpenAI', () => {
  const prompt: PromptMessage[] = [{ role: 'user', content: 'hello' }];
  const structure = z.object({ result: z.string() });

  let baseOpenAI: BaseOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithStructuredOutput.mockReturnValue({ stream: mockStream });
    baseOpenAI = new BaseOpenAI('gpt-5.4-nano-2026-03-17', 0.15, 0.6);
  });

  describe('call', () => {
    it('should log only a warning before retrying and then return the retried response', async () => {
      const retryError = new Error('temporary failure');

      mockStream.mockRejectedValueOnce(retryError).mockResolvedValueOnce(createAsyncStream([{ result: 'ok' }]));

      const result = await baseOpenAI.call(prompt, structure);

      expect(result).toEqual({ result: 'ok' });
      expect(logWarn).toHaveBeenCalledWith('llm.call.retry', 'Retrying LLM stream after failure', {
        errorMessage: 'temporary failure',
        remainingAttempts: 1,
      });
      expect(logError).not.toHaveBeenCalled();
    });

    it('should log an error only after retries are exhausted and rethrow the terminal failure', async () => {
      const firstError = new Error('permanent failure');
      const secondError = new Error('permanent failure');

      mockStream.mockRejectedValueOnce(firstError).mockRejectedValueOnce(secondError);

      await expect(baseOpenAI.call(prompt, structure)).rejects.toBe(secondError);

      expect(logWarn).toHaveBeenCalledWith('llm.call.retry', 'Retrying LLM stream after failure', {
        errorMessage: 'permanent failure',
        remainingAttempts: 1,
      });
      expect(logError).toHaveBeenCalledWith('llm.call', secondError, { remainingAttempts: 0 });
    });

    it('should log the terminal empty-answer failure and preserve the current undefined return behaviour', async () => {
      mockStream.mockImplementation(() => createAsyncStream([]));

      await expect(baseOpenAI.call(prompt, structure)).resolves.toBeUndefined();

      expect(logWarn).toHaveBeenCalledWith('llm.call.retry', 'Retrying LLM stream after failure', {
        errorMessage: 'Answer is empty',
        remainingAttempts: 1,
      });
      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('llm.call', expect.any(Error), { remainingAttempts: 0 });

      const loggedError = jest.mocked(logError).mock.calls[0]?.[1];

      expect(loggedError).toBeInstanceOf(Error);

      if (!(loggedError instanceof Error)) {
        throw new Error('Expected logged terminal failure to be an Error instance');
      }

      expect(loggedError.message).toBe('Answer is empty');
    });
  });
});
