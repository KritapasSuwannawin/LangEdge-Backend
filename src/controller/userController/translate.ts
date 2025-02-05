import { Request, Response } from 'express';
import zod from 'zod';

import { getLanguage } from '../../model/languageModel';

import { parseQuery, logError } from '../../module/systemModule';

import {
  determineLanguageAndCategory,
  translateTextAndGenerateSynonyms,
  generateSynonyms,
  generateExampleSentences,
} from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const parsedQuery = parseQuery(req.query as Record<string, string>);

  const querySchema = zod.object({
    text: zod.string().max(400),
    outputLanguageId: zod.number().int().positive(),
  });

  const { success, data } = querySchema.safeParse(parsedQuery);

  if (!success) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  const { text, outputLanguageId } = data;

  try {
    // Get the output language name
    // Determine the language and category of the input text
    const [[outputLanguage], languageAndCategory] = await Promise.all([
      getLanguage(outputLanguageId, ['name']),
      determineLanguageAndCategory(text),
    ]);

    if (!outputLanguage) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const outputLanguageName = outputLanguage.name as string;

    if (!languageAndCategory) {
      throw new Error('Failed to determine language and category');
    }

    if ('errorMessage' in languageAndCategory) {
      res.status(400).json({ message: languageAndCategory.errorMessage });
      return;
    }

    const { language: originalLanguage, category } = languageAndCategory;
    const isShortInputText = category === 'Word' || category === 'Phrase';

    // Input text is already in the output language -> Return the input text as the translation
    if (originalLanguage.toLowerCase() === outputLanguageName.toLowerCase()) {
      res.status(200).json({ data: { originalLanguage, translation: text } });
      return;
    }

    // Translate the input text and generate synonyms for its translation
    // Generate synonyms for the input text
    // Generate example sentences
    const [translatedTextAndSynonyms, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
      translateTextAndGenerateSynonyms(text, isShortInputText, originalLanguage, outputLanguageName),
      isShortInputText ? generateSynonyms(text, originalLanguage) : [],
      isShortInputText ? generateExampleSentences(text, originalLanguage, outputLanguageName) : [],
    ]);

    if (!translatedTextAndSynonyms || !inputTextSynonymArr) {
      throw new Error('Failed to translate text and generate synonyms');
    }

    const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

    res.status(200).json({ data: { originalLanguage, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr } });
  } catch (err) {
    logError('getTranslation', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getTranslation };
