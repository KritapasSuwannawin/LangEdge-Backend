import { ZodType } from 'zod';

export default interface Model {
  inputCost: number;
  outputCost: number;

  getNumTokens(prompt: string): Promise<number>;

  calculateCost(inputPrompt: string, outputPrompt: string): Promise<number>;

  call(
    prompt: { role: 'user' | 'system'; content: string }[],
    structure: ZodType<Record<string, unknown>>,
    timeout: number
  ): Promise<Record<string, unknown> | void>;
}
