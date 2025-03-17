import express from 'express';

import authController from '../modules/auth/controllers/authController';

const router = express.Router();

router.route('/token/refresh').post(authController.refreshToken);

export default router;
