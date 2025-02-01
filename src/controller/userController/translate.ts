import { Request, Response } from 'express';

import { getLanguage } from '../../model/languageModel';

import { parseQuery, logError } from '../../module/systemModule';

import { translateText } from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const { text, outputLanguageId } = parseQuery(req.query as Record<string, string | undefined>);

  if (typeof text !== 'string' || typeof outputLanguageId !== 'number' || text.length > 100) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  try {
    const outputLanguage = (await getLanguage(outputLanguageId, ['name']))[0];

    if (!outputLanguage) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const translationOutput = await translateText(text, outputLanguage.name as string);

    if (!translationOutput) {
      throw new Error('Failed to translate');
    }

    if ('errorMessage' in translationOutput) {
      res.status(400).json({ message: translationOutput.errorMessage });
      return;
    }

    res.status(200).json({ data: translationOutput });
  } catch (err) {
    logError('getTranslation', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getTranslation };
