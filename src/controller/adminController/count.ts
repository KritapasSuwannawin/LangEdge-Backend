import { Request, Response } from 'express';

const getCount = async (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { count: 1 } });
};

export default { getCount };
