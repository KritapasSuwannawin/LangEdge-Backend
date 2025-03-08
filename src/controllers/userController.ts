import { Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DatabaseError } from 'pg';
import zod from 'zod';

import userModel from '../models/userModel';

import { downloadFile } from '../utilities/httpUtility';
import { logError } from '../utilities/systemUtility';

const updateUser = async (req: Request, res: Response) => {
  const {
    user: { user_id: userId },
  } = req as { user: DecodedIdToken };

  const requestBodySchema = zod.object({ lastUsedLanguageId: zod.number().int().positive() });

  const { success: success, data: requestBody } = requestBodySchema.safeParse(req.body);

  if (!success) {
    res.status(400).json({ message: 'Bad request' });
    return;
  }

  try {
    const { lastUsedLanguageId } = requestBody;

    await userModel.updateUser(userId, { last_used_language_id: lastUsedLanguageId });

    res.status(200).json({ message: 'User updated' });
  } catch (err) {
    logError('updateUser', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const signInUser = async (req: Request, res: Response) => {
  const {
    user: { user_id: userId, email, name, picture: pictureUrl },
  } = req as { user: DecodedIdToken };

  let lastUsedLanguageId: number | undefined;

  try {
    try {
      await userModel.insertUser(userId, email!, name, pictureUrl ?? null);
    } catch (err) {
      // User already exists -> update user
      if (err instanceof DatabaseError && err.constraint === 'user_pkey') {
        const updatedUser = await userModel.updateUser(userId, { email, name, picture_url: pictureUrl ?? null });

        const { last_used_language_id } = updatedUser as { last_used_language_id: number | null };

        if (last_used_language_id !== null) {
          lastUsedLanguageId = last_used_language_id;
        }
      }
    }

    res
      .status(200)
      .json({ data: { userId, email, name, pictureUrl: pictureUrl ? await downloadFile(pictureUrl) : undefined, lastUsedLanguageId } });
  } catch (err) {
    logError('signInUser', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { updateUser, signInUser };
