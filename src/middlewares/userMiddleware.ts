import { Request, Response, NextFunction } from 'express';
import zod from 'zod';

import { extractToken, decodeToken } from '../utilities/authUtility';

export const validateAuthToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  const tokenSchema = zod.string().nonempty();
  const { success, data } = tokenSchema.safeParse(token);

  if (!success) {
    res.status(401).end();
    return;
  }

  const decodedData = decodeToken(data);

  if (!decodedData) {
    res.status(403).end();
    return;
  }

  next();
};
