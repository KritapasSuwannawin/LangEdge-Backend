import BaseOpenAI from './baseOpenAI';

export default class GPT4o extends BaseOpenAI {
  constructor() {
    super('gpt-4o-2024-11-20', 2.5, 10);
  }
}
