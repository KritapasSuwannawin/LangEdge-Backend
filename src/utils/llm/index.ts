import { z } from 'zod';

import { logError } from '../../module/systemModule';

import GPT4oMini from './model/gpt4oMini';

export const translateText = async (
  text: string,
  outputLanguage: string
): Promise<{ originalLanguage: string; translation: string } | { errorMessage: string } | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are a highly skilled language translator.

Your task is to process the given input text and produce a JSON response.

Processing instructions:
1. Determine the language of the input text.
2. Translate the text into ${outputLanguage}.

Output requirements:
- If the input is valid and translatable: output { "originalLanguage": "...", "translation": "..." }
- If the input is one of the edge cases below, output only: { "errorMessage": "..." }

Edge cases:
1. If the input text is invalid (e.g., non-understandable, non-textual content, or not translatable), set errorMessage to "Invalid input".
2. If the detected language of the input is the same as the target language (${outputLanguage}), set errorMessage to "Same language".

Input text:
--- (start of text) ---
${text}
--- (end of text) ---`,
      z.object({
        output: z.union([
          z.object({
            originalLanguage: z.string().describe('The language of the input text'),
            translation: z.string().describe('The translated text'),
          }),
          z.object({ errorMessage: z.enum(['Invalid input', 'Same language']).describe('The error message based on edge cases') }),
        ]),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('translateText:', llmOutput);

    return llmOutput.output as { originalLanguage: string; translation: string } | { errorMessage: string };
  } catch (err) {
    logError('translateText', err);
    return null;
  }
};
