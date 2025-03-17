import { Request, Response } from 'express';
import zod from 'zod';

import languageModel from '../infrastructure/models/languageModel';

import { parseQuery, logError } from '../shared/utils/systemUtils';

const getLanguage = async (req: Request, res: Response) => {
  const parsedQuery = parseQuery(req.query as Record<string, string>);

  const querySchema = zod.object({ id: zod.number().int().positive().optional() });
  const { success, data } = querySchema.safeParse(parsedQuery);

  if (!success) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  const { id } = data;

  try {
    const languageArr = await languageModel.getLanguage(id, ['id', 'name', 'code']);

    res.status(200).json({ data: { languageArr } });
  } catch (err) {
    logError('getLanguage', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { getLanguage };
