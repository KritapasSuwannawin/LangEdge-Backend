import { Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DatabaseError } from 'pg';

import userModel from '../../models/userModel';

import { downloadFile } from '../../utilities/httpUtility';
import { logError } from '../../utilities/systemUtility';

const signInUser = async (req: Request, res: Response) => {
  const {
    user: { user_id: userId, email, name, picture: pictureUrl },
  } = req as { user: DecodedIdToken };

  try {
    try {
      await userModel.insertUser(userId, email!, name, pictureUrl ?? null);
    } catch (err) {
      const { constraint } = err as DatabaseError;

      // User already exists -> update user
      if (constraint === 'user_pkey') {
        await userModel.updateUser(userId, { email, name, picture_url: pictureUrl ?? null });
      }
    }

    res.status(200).json({ data: { userId, email, name, pictureUrl: pictureUrl ? await downloadFile(pictureUrl) : undefined } });
  } catch (err) {
    logError('signInUser', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default { signInUser };
