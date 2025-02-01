import { Request, Response } from 'express';

import { getLanguage } from '../../model/languageModel';

import { parseQuery, logError } from '../../module/systemModule';

import { determineLanguageAndCategory, translateTextAndGenerateSynonyms, generateSynonyms } from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const { text, outputLanguageId } = parseQuery(req.query as Record<string, string | undefined>);

  if (typeof text !== 'string' || typeof outputLanguageId !== 'number' || text.length > 100) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  try {
    // Get the output language name
    const outputLanguage = (await getLanguage(outputLanguageId, ['name']))[0];

    if (!outputLanguage) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const outputLanguageName = outputLanguage.name as string;

    // Determine the language and category of the input text
    const languageAndCategory = await determineLanguageAndCategory(text);

    if (!languageAndCategory) {
      throw new Error('Failed to determine language and category');
    }

    if ('errorMessage' in languageAndCategory) {
      res.status(400).json({ message: languageAndCategory.errorMessage });
      return;
    }

    const { language: originalLanguage, category } = languageAndCategory;
    const isGenerateSynonyms = category === 'Word' || category === 'Phrase';

    // Input text is already in the output language -> Return the input text as the translation
    if (originalLanguage.toLowerCase() === outputLanguageName.toLowerCase()) {
      res.status(200).json({ data: { translation: text } });
      return;
    }

    // Translate the input text and generate synonyms for both the input text and the translation
    const [translatedTextAndSynonyms, inputTextSynonymArr] = await Promise.all([
      translateTextAndGenerateSynonyms(text, isGenerateSynonyms, originalLanguage, outputLanguageName),
      isGenerateSynonyms ? generateSynonyms(text, originalLanguage) : ([] as string[]),
    ]);

    if (!translatedTextAndSynonyms || !inputTextSynonymArr) {
      throw new Error('Failed to translate text and generate synonyms');
    }

    const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

    res.status(200).json({ data: { originalLanguage, inputTextSynonymArr, translation, translationSynonymArr } });
  } catch (err) {
    logError('getTranslation', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getTranslation };
