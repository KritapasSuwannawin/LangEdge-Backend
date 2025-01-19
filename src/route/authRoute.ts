import express from 'express';

import authController from '../controller/authController';

const router = express.Router();

router.route('/token').get(authController.getToken);

export default router;
