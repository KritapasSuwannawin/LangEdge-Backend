import { Request, Response } from 'express';

import { generateToken } from '../../utilities/authUtility';

const getToken = async (_req: Request, res: Response) => {
  // TODO: Change the payload to the user's data
  const token = generateToken({ client: 'frontend' });

  res.status(200).json({ data: { token } });
};

export default { getToken };
