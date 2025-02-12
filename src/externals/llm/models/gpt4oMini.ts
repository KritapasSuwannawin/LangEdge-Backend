import Model from '../interfaces/model';

import BaseOpenAI from './baseOpenAI';

export default class GPT4oMini extends BaseOpenAI implements Model {
  constructor() {
    super('gpt-4o-mini-2024-07-18', 0.15, 0.6);
  }
}
