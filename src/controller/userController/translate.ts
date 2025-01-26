import { Request, Response } from 'express';

import { getLanguage } from '../../model/languageModel';

import { translateText } from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const { text, outputOutputLanguageId: outputOutputLanguageIdString } = req.query as {
    text?: string;
    outputOutputLanguageId?: string;
  };

  const trimmedText = text?.trim();

  if (!trimmedText || trimmedText.length > 100 || !outputOutputLanguageIdString) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const outputLanguageId = parseInt(outputOutputLanguageIdString, 10);

  if (isNaN(outputLanguageId)) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const outputLanguage = (await getLanguage(outputLanguageId, ['name']))[0];

  if (!outputLanguage) {
    res.status(400).json({ message: 'Invalid input' });
    return;
  }

  const translationOutput = await translateText(trimmedText, outputLanguage.name as string);

  if (!translationOutput) {
    res.status(500).json({ message: 'Failed to translate' });
    return;
  }

  if ('errorMessage' in translationOutput) {
    res.status(400).json({ message: translationOutput.errorMessage });
    return;
  }

  res.status(200).json({ data: translationOutput });
};

export default { getTranslation };
