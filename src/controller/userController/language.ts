import { Request, Response } from 'express';

import languageModel from '../../model/languageModel';

const getLanguage = async (req: Request, res: Response) => {
  const { id } = req.query as { id?: string };

  let parsedId: number | 'ANY' = 'ANY';

  if (id) {
    parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
  }

  const languageArr = await languageModel.getLanguage(parsedId);

  res.status(200).json({ data: { languageArr } });
};

export default { getLanguage };
