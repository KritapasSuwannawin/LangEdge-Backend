import express from 'express';

import userController from '../controllers/userController';

import { validateAccessToken } from '../middlewares/userMiddleware';

const router = express.Router();

// Translation
router.route('/translation').get(validateAccessToken, userController.getTranslation);

// Language
router.route('/language').get(userController.getLanguage);

// User
router.route('/sign-in').post(validateAccessToken, userController.signInUser);

export default router;
