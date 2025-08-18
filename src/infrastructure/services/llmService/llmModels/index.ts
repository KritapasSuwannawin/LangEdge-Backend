import GPT4oMini from './gpt4oMini';

export const getLLM = (modelName: 'gpt-4o-mini' = 'gpt-4o-mini') => {
  switch (modelName) {
    case 'gpt-4o-mini':
      return new GPT4oMini();
    default:
      throw new Error('Invalid model name');
  }
};
