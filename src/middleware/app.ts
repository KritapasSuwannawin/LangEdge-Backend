import { Request, Response, NextFunction } from 'express';

// Allow each value of the request query is either a string or undefined
export const validateRequestQuery = (req: Request, res: Response, next: NextFunction) => {
  if (Object.values(req.query).some((value) => typeof value !== 'string' && value !== undefined)) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  next();
};
