import { Request, Response } from 'express';

import { getLanguage } from '../../model/languageModel';

import { translateText } from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const {
    text,
    inputLanguageId: inputLanguageIdString,
    outputOutputLanguageId: outputOutputLanguageIdString,
  } = req.query as {
    text?: string;
    inputLanguageId?: string;
    outputOutputLanguageId?: string;
  };

  const trimmedText = text?.trim();

  if (!trimmedText || !inputLanguageIdString || !outputOutputLanguageIdString) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const inputLanguageId = parseInt(inputLanguageIdString, 10);
  const outputLanguageId = parseInt(outputOutputLanguageIdString, 10);

  if (isNaN(inputLanguageId) || isNaN(outputLanguageId)) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const [inputLanguage, outputLanguage] = (
    await Promise.all([getLanguage(inputLanguageId, ['name']), getLanguage(outputLanguageId, ['name'])])
  ).map((language) => language[0]);

  if (!inputLanguage || !outputLanguage) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const inputLanguageName = inputLanguage.name as string;
  const outputLanguageName = outputLanguage.name as string;

  const translation = await translateText(trimmedText, inputLanguageName, outputLanguageName);

  if (!translation) {
    res.status(500).json({ message: 'Failed to translate' });
    return;
  }

  res.status(200).json({ data: { translation } });
};

export default { getTranslation };
