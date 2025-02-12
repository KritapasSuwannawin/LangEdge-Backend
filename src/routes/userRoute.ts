import express from 'express';

import userController from '../controllers/userController';

import { validateAuthToken } from '../middlewares/userMiddleware';

const router = express.Router();

// Translation
router.route('/translation').get(validateAuthToken, userController.getTranslation);

// Language
router.route('/language').get(validateAuthToken, userController.getLanguage);

export default router;
