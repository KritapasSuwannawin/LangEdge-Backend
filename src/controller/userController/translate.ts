import { Request, Response } from 'express';

import { translateText } from '../../utils/llm';

const getTranslation = async (req: Request, res: Response) => {
  const { text } = req.query as { text: string };

  if (!text) {
    res.status(400).json({ message: 'Missing text' });
    return;
  }

  const translation = await translateText(text);

  if (!translation) {
    res.status(500).json({ message: 'Failed to translate' });
    return;
  }

  res.status(200).json({ data: { translation } });
};

export default { getTranslation };
