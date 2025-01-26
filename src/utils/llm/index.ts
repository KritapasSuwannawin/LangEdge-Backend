import { z } from 'zod';

import { logError } from '../../module/systemModule';

import GPT4oMini from './model/gpt4oMini';

export const translateText = async (text: string, inputLanguage: string, outputLanguage: string): Promise<string | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are given a text in ${inputLanguage}.

Your task is to translate this text into ${outputLanguage}.

Text:
--- (start of text) ---
${text}
--- (end of text) ---

Output your response in JSON format only, following these rules:
1. If a translation can be generated, output: { "translation" : "..." }.
2. If no translation can be generated, output: { "translation" : "no translation" }.`,
      z.object({
        translation: z.string().describe('The translated text'),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    const { translation } = llmOutput as { translation: string };

    if (translation.toLowerCase().includes('no translation')) {
      return null;
    }

    return translation;
  } catch (err) {
    logError('translateText', err);
    return null;
  }
};
