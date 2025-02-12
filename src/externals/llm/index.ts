import { z } from 'zod';

import { logError } from '../../utilities/systemUtility';

import GPT4oMini from './models/gpt4oMini';

export const determineLanguageAndCategory = async (
  text: string
): Promise<{ language: string; category: 'Word' | 'Phrase' | 'Sentence' | 'Paragraph' } | { errorMessage: 'Invalid input' } | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are a linguistic expert.

Your task is to process the given input text and produce a JSON response.

Processing instructions:
1. Determine the language of the input text.
2. Determine the linguistic category of the input text.

Output requirements:
- If the input text is understandable: output { "language": "...", "category": "..." }
- If the input text is invalid (e.g., non-understandable or non-textual content), output { "errorMessage": "Invalid input" }

Input text: ${text}`,
      z.object({
        output: z.union([
          z.object({
            language: z.string().describe('The language of the input text'),
            category: z.enum(['Word', 'Phrase', 'Sentence', 'Paragraph']).describe('The linguistic category of the input text'),
          }),
          z.object({ errorMessage: z.enum(['Invalid input']).describe('The error message based on edge cases') }),
        ]),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('determineLanguageAndCategory:', llmOutput);

    return llmOutput.output as
      | { language: string; category: 'Word' | 'Phrase' | 'Sentence' | 'Paragraph' }
      | { errorMessage: 'Invalid input' };
  } catch (err) {
    logError('determineLanguageAndCategory', err);
    return null;
  }
};

export const translateTextAndGenerateSynonyms = async (
  text: string,
  isGenerateSynonyms: boolean,
  inputLanguage: string,
  outputLanguage: string
): Promise<{ translation: string; synonyms: string[] } | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are a linguistic expert.

Your task is to process the given input text and produce a JSON response.

Processing instructions:
1. Translate the text from ${inputLanguage} into ${outputLanguage}.
${isGenerateSynonyms ? `2. Generate 3-5 synonyms for the translated text in ${outputLanguage}.` : ''}

${
  isGenerateSynonyms
    ? `Output requirements: 
- If synonyms can be generated, output { "translation": "...", "synonyms": [ ... ] }
- If no synonym can be generated, output only: { "translation": "..." }`
    : `Output format: { "translation": "..." }`
}

Input text: ${text}`,
      isGenerateSynonyms
        ? z.object({
            translation: z.string().describe('The translated text'),
            synonyms: z
              .array(z.string().describe('Each synonym of the translated text'))
              .min(3)
              .max(5)
              .optional()
              .describe('The synonyms of the translated text'),
          })
        : z.object({ translation: z.string().describe('The translated text') })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('translateTextAndGenerateSynonyms:', llmOutput);

    const { translation, synonyms } = llmOutput as { translation: string; synonyms?: string[] };

    return { translation, synonyms: synonyms ?? [] };
  } catch (err) {
    logError('translateTextAndGenerateSynonyms', err);
    return null;
  }
};

export const generateSynonyms = async (text: string, language: string): Promise<string[] | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are a linguistic expert.

Your task is to process the given input text and produce a JSON response.

Processing instruction: Generate 3-5 synonyms for the input text in ${language}.

Output requirements:
- If synonyms can be generated, output { "synonyms": [ ... ] }
- If no synonym can be generated, output am empty array: { "synonyms": [] }

Input text: ${text}`,
      z.object({
        synonyms: z.array(z.string().describe('Each synonym of the input text')).min(3).max(5).describe('The synonyms of the input text'),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('generateSynonyms:', llmOutput);

    const { synonyms } = llmOutput as { synonyms: string[] };

    return synonyms;
  } catch (err) {
    logError('generateSynonyms', err);
    return null;
  }
};

export const generateExampleSentences = async (
  text: string,
  inputLanguage: string,
  translationLanguage: string
): Promise<{ sentence: string; translation: string }[] | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      `You are a linguistic expert.

Your task is to process the given input text and produce a JSON response.

Processing instruction:
1. Generate 3 example sentences for the input text in ${inputLanguage}.
2. Translate each example sentence into ${translationLanguage}.

Output format: [ { "sentence": "...", "translation": "..." }, ... ]

Input text: ${text}`,
      z.object({
        output: z
          .array(
            z.object({
              sentence: z.string().describe('The example sentence of the input text'),
              translation: z.string().describe('The translation of the example sentence'),
            })
          )
          .length(3)
          .describe('The example sentences and their translations'),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('generateExampleSentences:', llmOutput);

    return llmOutput.output as { sentence: string; translation: string }[];
  } catch (err) {
    logError('generateExampleSentences', err);
    return null;
  }
};
