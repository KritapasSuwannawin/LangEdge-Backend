import { Request, Response } from 'express';
import zod from 'zod';

import languageModel from '../infrastructure/models/languageModel';
import translationModel from '../infrastructure/models/translationModel';
import synonymModel from '../infrastructure/models/synonymModel';
import exampleSentenceModel from '../infrastructure/models/exampleSentenceModel';

import { parseQuery, logError } from '../shared/utils/systemUtils';

import {
  determineLanguageAndCategory,
  translateTextAndGenerateSynonyms,
  generateSynonyms,
  generateExampleSentences,
} from '../infrastructure/services/llmService';

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
      languageModel.getLanguage(outputLanguageId, ['name']),
      determineLanguageAndCategory(text),
    ]);

    const outputLanguageSchema = zod.object({ name: zod.string().nonempty() });
    const { success: outputLanguageSuccess, data: outputLanguageData } = outputLanguageSchema.safeParse(outputLanguage);

    if (!outputLanguageSuccess) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const { name: outputLanguageName } = outputLanguageData;

    if (!languageAndCategory) {
      throw new Error('Failed to determine language and category');
    }

    if ('errorMessage' in languageAndCategory) {
      res.status(400).json({ message: languageAndCategory.errorMessage });
      return;
    }

    const { language: originalLanguageName, category } = languageAndCategory;
    const isShortInputText = category === 'Word' || category === 'Phrase';

    const originalLanguage = await languageModel.getLanguageByName(originalLanguageName, ['id']);

    const originalLanguageSchema = zod.object({ id: zod.number().int().positive() });
    const { success: originalLanguageSuccess, data: originalLanguageData } = originalLanguageSchema.safeParse(originalLanguage);

    if (!originalLanguageSuccess) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const { id: originalLanguageId } = originalLanguageData;

    // Input text is already in the output language -> Return the input text as the translation
    if (originalLanguageName.toLowerCase() === outputLanguageName.toLowerCase()) {
      res.status(200).json({ data: { originalLanguageName, translation: text } });
      return;
    }

    // Check if the translation already exists in the database
    const translationRecord = await translationModel.getTranslationByText(text, originalLanguageId, outputLanguageId, ['output_text']);

    const translationRecordSchema = zod.object({ output_text: zod.string().nonempty() });
    const { success: translationRecordSuccess, data: translationRecordData } = translationRecordSchema.safeParse(translationRecord);

    if (translationRecordSuccess) {
      const { output_text: translation } = translationRecordData;

      if (!isShortInputText) {
        res.status(200).json({ data: { originalLanguageName, translation } });
        return;
      }

      const [inputTextSynonymRecordArr, translationSynonymRecordArr, exampleSentenceRecordArr] = await Promise.all([
        synonymModel.getSynonymByText(text, originalLanguageId, ['synonym_arr']),
        synonymModel.getSynonymByText(translation, outputLanguageId, ['synonym_arr']),
        exampleSentenceModel.getExampleSentenceByText(text, originalLanguageId, outputLanguageId, ['example_sentence_translation_id_arr']),
      ]);

      const inputTextSynonymRecordArrSchema = zod.object({ synonym_arr: zod.array(zod.string().nonempty()) });
      const translationSynonymRecordArrSchema = zod.object({ synonym_arr: zod.array(zod.string().nonempty()) });
      const exampleSentenceRecordArrSchema = zod.object({ example_sentence_translation_id_arr: zod.array(zod.number().int().positive()) });

      const { success: inputTextSynonymRecordArrSuccess, data: inputTextSynonymRecordArrData } =
        inputTextSynonymRecordArrSchema.safeParse(inputTextSynonymRecordArr);
      const { success: translationSynonymRecordArrSuccess, data: translationSynonymRecordArrData } =
        translationSynonymRecordArrSchema.safeParse(translationSynonymRecordArr);
      const { success: exampleSentenceRecordArrSuccess, data: exampleSentenceRecordArrData } =
        exampleSentenceRecordArrSchema.safeParse(exampleSentenceRecordArr);

      if (inputTextSynonymRecordArrSuccess && translationSynonymRecordArrSuccess && exampleSentenceRecordArrSuccess) {
        const { example_sentence_translation_id_arr: exampleSentenceTranslationIdArr } = exampleSentenceRecordArrData;

        const exampleSentenceTranslationArr = await Promise.all(
          exampleSentenceTranslationIdArr.map(
            async (translationId) => (await translationModel.getTranslation(translationId, ['input_text', 'output_text']))[0]
          )
        );

        const exampleSentenceTranslationArrSchema = zod.array(
          zod.object({ input_text: zod.string().nonempty(), output_text: zod.string().nonempty() })
        );

        const { success: exampleSentenceTranslationArrSuccess, data: exampleSentenceTranslationArrData } =
          exampleSentenceTranslationArrSchema.safeParse(exampleSentenceTranslationArr);

        if (exampleSentenceTranslationArrSuccess) {
          const exampleSentenceArr = exampleSentenceTranslationArrData.map(({ input_text: sentence, output_text: translation }) => ({
            sentence,
            translation,
          }));

          res.status(200).json({
            data: {
              originalLanguageName,
              inputTextSynonymArr: inputTextSynonymRecordArrData.synonym_arr,
              translation,
              translationSynonymArr: translationSynonymRecordArrData.synonym_arr,
              exampleSentenceArr,
            },
          });

          return;
        }
      }
    }

    // Translate the input text and generate synonyms for its translation
    // Generate synonyms for the input text
    // Generate example sentences
    const [translatedTextAndSynonyms, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
      translateTextAndGenerateSynonyms(text, isShortInputText, originalLanguageName, outputLanguageName),
      isShortInputText ? generateSynonyms(text, originalLanguageName) : [],
      isShortInputText ? generateExampleSentences(text, originalLanguageName, outputLanguageName) : [],
    ]);

    if (!translatedTextAndSynonyms || !inputTextSynonymArr || !exampleSentenceArr) {
      throw new Error('Failed to translate text and generate synonyms');
    }

    const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

    res.status(200).json({ data: { originalLanguageName, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr } });

    // isShortInputText && inputTextSynonym, translationSynonym, and exampleSentence exist -> Store output to database
    try {
      if (isShortInputText && [inputTextSynonymArr, translationSynonymArr, exampleSentenceArr].every((arr) => arr.length > 0)) {
        const exampleSentenceTranslationIdResultArr = await Promise.allSettled(
          exampleSentenceArr.map(({ sentence, translation }) =>
            translationModel.insertTranslation(sentence, originalLanguageId, translation, outputLanguageId)
          )
        );

        const exampleSentenceTranslationIdArr = exampleSentenceTranslationIdResultArr
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);

        const storeOutputResultArr = await Promise.allSettled([
          translationModel.insertTranslation(text, originalLanguageId, translation, outputLanguageId),
          synonymModel.insertSynonym(text, inputTextSynonymArr, originalLanguageId),
          synonymModel.insertSynonym(translation, translationSynonymArr, outputLanguageId),
          exampleSentenceTranslationIdArr.length > 0 &&
            exampleSentenceModel.insertExampleSentence(text, exampleSentenceTranslationIdArr, originalLanguageId, outputLanguageId),
        ]);

        // some non-constraint error occurred -> throw error
        for (const storeOutputResult of storeOutputResultArr) {
          if (storeOutputResult.status === 'rejected' && !('constraint' in storeOutputResult.reason)) {
            throw storeOutputResult.reason;
          }
        }
      }
    } catch (err) {
      logError('storeOutput', err);
    }
  } catch (err) {
    logError('getTranslation', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getTranslation };
