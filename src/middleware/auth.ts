import { Request, Response, NextFunction } from 'express';

import { extractToken, decodeToken } from '../module/authModule';

export const checkAuthToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).end();
    return;
  }

  const decodedData = decodeToken(token);

  if (!decodedData) {
    res.status(403).end();
    return;
  }

  next();
};
