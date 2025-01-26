import express from 'express';

import userController from '../controller/userController';

import { checkAuthToken } from '../middleware/auth';

const router = express.Router();

// Translation
router.route('/translation').get(checkAuthToken, userController.getTranslation);

// Language
router.route('/language').get(checkAuthToken, userController.getLanguage);

export default router;
