import { Request, Response } from 'express';
import zod from 'zod';

import { logError } from '../../../shared/utils/systemUtils';

import { refreshTokenSchema } from '../schemas/authSchema';
import RefreshTokenUseCase from '../useCases/RefreshTokenUseCase';

const refreshTokenUseCase = new RefreshTokenUseCase();

const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const result = await refreshTokenUseCase.execute(refreshToken);

    res.status(200).json({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof zod.ZodError) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    logError('refreshToken', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { refreshToken };
