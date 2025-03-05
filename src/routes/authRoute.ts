import express from 'express';

import authController from '../controllers/authController';

const router = express.Router();

router.route('/token/refresh').post(authController.refreshToken);

export default router;
