import { Request } from 'express';

export const extractBearerToken = (req: Request): string | null => {
  if (req.headers.authorization) {
    const [type, token] = req.headers.authorization.split(' ');

    if (type === 'Bearer' && token) {
      return token;
    }
  }

  return null;
};
