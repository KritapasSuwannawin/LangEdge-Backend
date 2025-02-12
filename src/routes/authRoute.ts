import express from 'express';

import authController from '../controllers/authController';

const router = express.Router();

router.route('/token').get(authController.getToken);

export default router;
