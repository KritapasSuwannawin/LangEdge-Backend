import GPT4oMini from '@/infrastructure/llm/models/gpt4oMini';

import type { LLM } from '@/infrastructure/llm/models/llm.interface';

export const getLLM = (modelName: 'gpt-4o-mini' = 'gpt-4o-mini'): LLM => {
  switch (modelName) {
    case 'gpt-4o-mini':
      return new GPT4oMini();
    default:
      throw new Error('Invalid model name');
  }
};
