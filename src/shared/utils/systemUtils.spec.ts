import { logError, logInfo, logWarn } from '@/shared/utils/systemUtils';

describe('systemUtils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logInfo', () => {
    it('should serialize safe metadata and omit undefined values', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);

      logInfo('translate.loadLanguages', 'Completed request', {
        cached: false,
        languageCount: 3,
        skipped: undefined,
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith('translate.loadLanguages: Completed request {"cached":false,"languageCount":3}');
    });
  });

  describe('logWarn', () => {
    it('should emit a context-prefixed warning when metadata is not provided', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      logWarn('llm.call.retry', 'Retrying LLM stream after failure');

      expect(consoleWarnSpy).toHaveBeenCalledWith('llm.call.retry: Retrying LLM stream after failure');
    });
  });

  describe('logError', () => {
    it.each([
      [new Error('OpenAI request failed'), 'llm.call: OpenAI request failed {"remainingAttempts":0}'],
      ['OpenAI request failed', 'llm.call: OpenAI request failed {"remainingAttempts":0}'],
      [{ code: 'E_UNKNOWN' }, 'llm.call: Unknown error {"remainingAttempts":0}'],
    ])('should format %p safely for console.error', (errorValue: unknown, expectedMessage: string) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      logError('llm.call', errorValue, { remainingAttempts: 0 });

      expect(consoleErrorSpy).toHaveBeenCalledWith(expectedMessage);
    });
  });
});
