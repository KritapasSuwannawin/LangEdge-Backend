import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { logError } from '../utilities/systemUtility';

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!) as ServiceAccount) });

const auth = getAuth();

export const verifyAccessToken = async (accessToken: string) => {
  try {
    return await auth.verifyIdToken(accessToken);
  } catch (err) {
    logError('verifyAccessToken', err);
    return null;
  }
};
