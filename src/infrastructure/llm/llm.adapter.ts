import zod from 'zod';
import { Injectable } from '@nestjs/common';

import type { ILLMPort, LanguageAndCategory } from '@/domain/shared/ports/i-llm.port';
import type { LLM } from '@/infrastructure/llm/models/llm.interface';
import { getLLM } from '@/infrastructure/llm/models';
import { logError, logInfo } from '@/shared/utils/systemUtils';

@Injectable()
export class LLMAdapter implements ILLMPort {
  private readonly llm: Pick<LLM, 'call'> = getLLM();

  async determineLanguageAndCategory(text: string): Promise<LanguageAndCategory | { errorMessage: 'Invalid input' } | null> {
    try {
      const llmOutput = await this.llm.call(
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
- If the input text is non-understandable, output { "errorMessage": "Invalid input" }

Note:
- A short understandable text is a word.`,
          },
          { role: 'user', content: text },
        ],
        zod.object({
          output: zod.union([
            zod.object({
              language: zod.string().describe('The language of the input text'),
              category: zod.enum(['Word', 'Phrase', 'Sentence', 'Paragraph']).describe('The linguistic category of the input text'),
            }),
            zod.object({
              errorMessage: zod.enum(['Invalid input']).describe('The error message based on edge cases'),
            }),
          ]),
        }),
        5000,
      );

      if (!llmOutput) {
        throw new Error('llmOutput is empty');
      }

      const output = llmOutput.output as LanguageAndCategory | { errorMessage: 'Invalid input' };

      logInfo(
        'llm.determineLanguageAndCategory',
        'Received structured LLM response',
        'errorMessage' in output ? { isValidInput: false } : { isValidInput: true, language: output.language, category: output.category },
      );

      return output;
    } catch (err) {
      logError('llm.determineLanguageAndCategory', err);
      return null;
    }
  }

  async translateTextAndGenerateSynonyms(
    text: string,
    isGenerateSynonyms: boolean,
    inputLanguage: string,
    outputLanguage: string,
  ): Promise<{ translation: string; synonyms: string[] } | null> {
    try {
      const llmOutput = await this.llm.call(
        [
          {
            role: 'system',
            content: `You are a linguistic expert.

Your task is to process the user's input text following the instructions below and produce a JSON response.

Instructions:
1. Translate the text from ${inputLanguage} into ${outputLanguage}.
${isGenerateSynonyms ? `2. Generate 3-5 synonyms for the translated text in ${outputLanguage}.` : ''}

Output format: ${isGenerateSynonyms ? '{ "translation": "...", "synonyms": [ ... ] }' : '{ "translation": "..." }'}`,
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
                .describe('The synonyms of the translated text'),
            })
          : zod.object({
              translation: zod.string().describe('The translated text'),
            }),
        5000,
      );

      if (!llmOutput) {
        throw new Error('llmOutput is empty');
      }

      const { translation, synonyms } = llmOutput as { translation: string; synonyms?: string[] };

      logInfo('llm.translateTextAndGenerateSynonyms', 'Received structured LLM response', {
        hasTranslation: translation.length > 0,
        synonymCount: synonyms?.length ?? 0,
        isGenerateSynonyms,
        inputLanguage,
        outputLanguage,
      });

      return { translation, synonyms: synonyms ?? [] };
    } catch (err) {
      logError('llm.translateTextAndGenerateSynonyms', err);
      return null;
    }
  }

  async generateSynonyms(text: string, language: string): Promise<string[] | null> {
    try {
      const llmOutput = await this.llm.call(
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
              synonyms: zod.array(zod.string()).length(0).describe('An empty array if no synonym can be generated'),
            }),
          ]),
        }),
        5000,
      );

      if (!llmOutput) {
        throw new Error('llmOutput is empty');
      }

      const { synonyms } = llmOutput.output as { synonyms: string[] };

      logInfo('llm.generateSynonyms', 'Received structured LLM response', {
        synonymCount: synonyms.length,
        language,
      });

      return synonyms;
    } catch (err) {
      logError('llm.generateSynonyms', err);
      return null;
    }
  }

  async generateExampleSentences(
    text: string,
    inputLanguage: string,
    translationLanguage: string,
  ): Promise<Array<{ sentence: string; translation: string }> | null> {
    try {
      const llmOutput = await this.llm.call(
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
              }),
            )
            .length(3)
            .describe('The example sentences and their translations'),
        }),
        5000,
      );

      if (!llmOutput) {
        throw new Error('llmOutput is empty');
      }

      const exampleSentences = llmOutput.output as Array<{ sentence: string; translation: string }>;

      logInfo('llm.generateExampleSentences', 'Received structured LLM response', {
        exampleCount: exampleSentences.length,
        inputLanguage,
        translationLanguage,
      });

      return exampleSentences;
    } catch (err) {
      logError('llm.generateExampleSentences', err);
      return null;
    }
  }
}
