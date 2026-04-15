import BaseOpenAI from '@/infrastructure/llm/models/baseOpenAI';

export default class GPT4oMini extends BaseOpenAI {
  constructor() {
    super('gpt-4o-mini-2024-07-18', 0.15, 0.6);
  }
}
