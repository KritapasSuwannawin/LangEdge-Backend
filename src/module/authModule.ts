import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { logError } from './systemModule';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });
};

export const extractToken = (req: Request): string | null => {
  if (req.headers.authorization) {
    const [type, token] = req.headers.authorization.split(' ');

    if (type === 'Bearer' && token) {
      return token;
    }
  }

  return null;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY!);

    if (typeof payload === 'string') {
      throw new Error('Invalid token');
    }

    return payload;
  } catch (err) {
    logError('decodeToken', err);
    return null;
  }
};
