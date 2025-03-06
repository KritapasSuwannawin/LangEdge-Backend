import express from 'express';
import rateLimit from 'express-rate-limit';

import userController from '../controllers/userController';

import { validateAccessToken } from '../middlewares/userMiddleware';

const router = express.Router();

// Rete limit - 10 requests per minute, using access token as an identifier
const rateLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, keyGenerator: (req) => req.headers.authorization! });

// Translation
router.route('/translation').get(validateAccessToken, rateLimiter, userController.getTranslation);

// Language
router.route('/language').get(userController.getLanguage);

// User
router.route('/sign-in').post(validateAccessToken, userController.signInUser);

export default router;
