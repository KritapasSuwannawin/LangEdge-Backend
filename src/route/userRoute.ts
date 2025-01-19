import express from 'express';

import userController from '../controller/userController';

import { checkAuthToken } from '../middleware/auth';

const router = express.Router();

router.route('/translation').get(checkAuthToken, userController.getTranslation);

export default router;
