import GPT4oMini from '@/infrastructure/llm/models/gpt4oMini';
import GPT54Nano from '@/infrastructure/llm/models/gpt54Nano';

import type { LLM } from '@/infrastructure/llm/models/llm.interface';

export const getLLM = (modelName: 'gpt-4o-mini' | 'gpt-5.4-nano' = 'gpt-5.4-nano'): LLM => {
  switch (modelName) {
    case 'gpt-4o-mini':
      return new GPT4oMini();
    case 'gpt-5.4-nano':
      return new GPT54Nano();
    default:
      throw new Error('Invalid model name');
  }
};
