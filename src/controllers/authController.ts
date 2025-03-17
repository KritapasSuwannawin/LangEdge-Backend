import { Request, Response } from 'express';
import zod from 'zod';

import { logError } from '../shared/utils/systemUtils';

const refreshToken = async (req: Request, res: Response) => {
  const requestBodySchema = zod.object({ refreshToken: zod.string() });

  const { success: parseRequestBodySuccess, data: requestBody } = requestBodySchema.safeParse(req.body);

  if (!parseRequestBodySuccess) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  const { refreshToken } = requestBody;

  try {
    const tokenDataResponse = await (
      await fetch(`https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      })
    ).json();

    const tokenDataSchema = zod.object({
      id_token: zod.string(),
      refresh_token: zod.string(),
    });

    const { success: parseTokenDataSuccess, data: tokenData } = tokenDataSchema.safeParse(tokenDataResponse);

    if (!parseTokenDataSuccess) {
      throw new Error('Failed to parse token data');
    }

    res.status(200).json({ data: { accessToken: tokenData.id_token, refreshToken: tokenData.refresh_token } });
  } catch (err) {
    logError('refreshToken', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { refreshToken };
