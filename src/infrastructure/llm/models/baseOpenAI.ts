import { ChatOpenAI } from '@langchain/openai';
import { ZodType } from 'zod';

import { LLM } from '@/infrastructure/llm/models/llm.interface';
import { logError, logWarn } from '@/shared/utils/systemUtils';

export default class BaseOpenAI implements LLM {
  llm: ChatOpenAI;
  inputCost: number;
  outputCost: number;

  constructor(model: string, inputCost: number, outputCost: number) {
    this.llm = new ChatOpenAI({ model, maxTokens: -1, streaming: true, cache: false });
    this.inputCost = inputCost;
    this.outputCost = outputCost;
  }

  async getNumTokens(prompt: string): Promise<number> {
    return await this.llm.getNumTokens(prompt);
  }

  async calculateCost(inputPrompt: string, outputPrompt: string): Promise<number> {
    const [inputToken, outputToken] = await Promise.all([this.getNumTokens(inputPrompt), this.getNumTokens(outputPrompt)]);
    return this.inputCost * (inputToken / 1000000) + this.outputCost * (outputToken / 1000000);
  }

  async call(
    prompt: { role: 'user' | 'system'; content: string }[],
    structure: ZodType<Record<string, unknown>>,
    timeout = 5000,
  ): Promise<Record<string, unknown> | void> {
    let availableCall = 2;
    while (availableCall > 0) {
      try {
        const controller = new AbortController();
        let streaming = false;

        const timer = setTimeout(() => {
          if (!streaming) {
            controller.abort();
          }
        }, timeout);
        timer.unref();

        let answer: Record<string, unknown> | undefined;

        const stream = await this.llm.withStructuredOutput(structure, { strict: true }).stream(prompt, { signal: controller.signal });

        for await (const chunk of stream) {
          streaming = true;
          answer = chunk;
        }

        if (answer) {
          return answer;
        }

        throw new Error('Answer is empty');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        availableCall--;

        if (availableCall === 0) {
          logError('llm.call', error, { remainingAttempts: availableCall });

          if (errorMessage === 'Answer is empty') {
            return;
          }

          throw error;
        }

        logWarn('llm.call.retry', 'Retrying LLM stream after failure', {
          errorMessage,
          remainingAttempts: availableCall,
        });
      }
    }

    return;
  }
}
