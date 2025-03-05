import { Request, Response, NextFunction } from 'express';
import zod from 'zod';

import { verifyAccessToken } from '../externals/firebase';

import { extractBearerToken } from '../utilities/authUtility';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}

export const validateAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const bearerToken = extractBearerToken(req);

  const tokenSchema = zod.string().nonempty();
  const { success, data: accessToken } = tokenSchema.safeParse(bearerToken);

  if (!success) {
    res.status(401).end();
    return;
  }

  const decodedData = await verifyAccessToken(accessToken);

  if (!decodedData) {
    res.status(401).end();
    return;
  }

  req.user = decodedData;
  next();
};
