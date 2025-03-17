import express from 'express';
import rateLimit from 'express-rate-limit';

import translateController from '../controllers/translateController';

import { validateAccessToken } from '../interfaces/middlewares/authMiddleware';

const router = express.Router();

// Rete limit - 10 requests per minute, using access token as an identifier
const rateLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, keyGenerator: (req) => req.headers.authorization! });

router.route('/').get(validateAccessToken, rateLimiter, translateController.getTranslation);

export default router;
