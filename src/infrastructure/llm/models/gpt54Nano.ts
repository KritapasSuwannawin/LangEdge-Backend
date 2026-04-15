import BaseOpenAI from '@/infrastructure/llm/models/baseOpenAI';

export default class GPT54Nano extends BaseOpenAI {
  constructor() {
    super('gpt-5.4-nano-2026-03-17', 0.2, 1.25);
  }
}
