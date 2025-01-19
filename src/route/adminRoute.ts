import express from 'express';

import adminController from '../controller/adminController';

import { checkAuthToken } from '../middleware/auth';

const router = express.Router();

router.route('/count').get(checkAuthToken, adminController.getCount);

export default router;
