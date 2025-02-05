import { Request, Response, NextFunction } from 'express';
import zod from 'zod';

// Allow each value of the request query to only be a string
export const validateRequestQuery = (req: Request, res: Response, next: NextFunction) => {
  const querySchema = zod.object({}).catchall(zod.string().optional());
  const { success } = querySchema.safeParse(req.query);

  if (!success) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  next();
};
