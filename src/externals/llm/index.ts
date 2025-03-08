import zod from 'zod';

import { logError } from '../../utilities/systemUtility';

import GPT4oMini from './models/gpt4oMini';

export const determineLanguageAndCategory = async (
  text: string
): Promise<{ language: string; category: 'Word' | 'Phrase' | 'Sentence' | 'Paragraph' } | { errorMessage: 'Invalid input' } | null> => {
  try {
    const llmOutput = await new GPT4oMini().call(
      [
        {
          role: 'system',
          content: `You are a linguistic expert.

Your task is to process the user's input text following the instructions below and produce a JSON response.

Instructions:
1. Determine the language of the input text.
2. Determine the linguistic category of the input text (word, phrase, sentence, or paragraph).

Output requirements:
- If the input text is understandable: output { "language": "...", "category": "..." }
- If the input text is invalid (e.g., non-understandable or non-textual content), output { "errorMessage": "Invalid input" }`,
        },
        { role: 'user', content: text },
      ],
      zod.object({
        output: zod.union([
          zod.object({
            language: zod.string().describe('The language of the input text'),
            category: zod.enum(['Word', 'Phrase', 'Sentence', 'Paragraph']).describe('The linguistic category of the input text'),
          }),
          zod.object({ errorMessage: zod.enum(['Invalid input']).describe('The error message based on edge cases') }),
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
      [
        {
          role: 'system',
          content: `You are a linguistic expert.

Your task is to process the user's input text following the instructions below and produce a JSON response.

Instructions:
1. Translate the text from ${inputLanguage} into ${outputLanguage}.
${isGenerateSynonyms ? `2. Generate 3-5 synonyms for the translated text in ${outputLanguage}.` : ''}

${
  isGenerateSynonyms
    ? `Output requirements: 
- If synonyms can be generated, output { "translation": "...", "synonyms": [ ... ] }
- If no synonym can be generated, output only: { "translation": "..." }`
    : `Output format: { "translation": "..." }`
}`,
        },
        { role: 'user', content: text },
      ],
      isGenerateSynonyms
        ? zod.object({
            translation: zod.string().describe('The translated text'),
            synonyms: zod
              .array(zod.string().describe('Each synonym of the translated text'))
              .min(3)
              .max(5)
              .optional()
              .describe('The synonyms of the translated text'),
          })
        : zod.object({ translation: zod.string().describe('The translated text') })
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
      [
        {
          role: 'system',
          content: `You are a linguistic expert.

Your task is to process the user's input text following the instruction below and produce a JSON response.

Instruction: Generate 3-5 synonyms for the input text in ${language}.

Output requirements:
- If synonyms can be generated, output { "synonyms": [ ... ] }
- If no synonym can be generated, output am empty array: { "synonyms": [] }`,
        },
        { role: 'user', content: text },
      ],
      zod.object({
        output: zod.union([
          zod.object({
            synonyms: zod
              .array(zod.string().describe('Each synonym of the input text'))
              .min(3)
              .max(5)
              .describe('The synonyms of the input text'),
          }),
          zod.object({
            synonyms: zod.array(zod.string().optional()).length(0).describe('An empty array if no synonym can be generated'),
          }),
        ]),
      })
    );

    if (!llmOutput) {
      throw new Error('llmOutput is empty');
    }

    console.log('generateSynonyms:', llmOutput);

    const { synonyms } = llmOutput.output as { synonyms: string[] };

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
      [
        {
          role: 'system',
          content: `You are a linguistic expert.

Your task is to process the user's input text following the instructions below and produce a JSON response.

Instruction:
1. Generate 3 example sentences for the input text in ${inputLanguage}.
2. Translate each example sentence into ${translationLanguage}.

Output format: [ { "sentence": "...", "translation": "..." }, ... ]`,
        },
        { role: 'user', content: text },
      ],

      zod.object({
        output: zod
          .array(
            zod.object({
              sentence: zod.string().describe('The example sentence of the input text'),
              translation: zod.string().describe('The translation of the example sentence'),
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
