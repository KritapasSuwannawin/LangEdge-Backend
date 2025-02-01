import { Request, Response } from 'express';

import languageModel from '../../model/languageModel';

import { parseQuery, logError } from '../../module/systemModule';

const getLanguage = async (req: Request, res: Response) => {
  const { id } = parseQuery(req.query as Record<string, string | undefined>);

  if (id !== undefined && typeof id !== 'number') {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  try {
    const languageArr = await languageModel.getLanguage(id);

    res.status(200).json({ data: { languageArr } });
  } catch (err) {
    logError('getLanguage', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getLanguage };
