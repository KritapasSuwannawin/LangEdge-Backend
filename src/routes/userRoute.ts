import express from 'express';

import userController from '../controllers/userController';

import { validateAccessToken } from '../middlewares/userMiddleware';

const router = express.Router();

router.route('/').patch(validateAccessToken, userController.updateUser);
router.route('/sign-in').post(validateAccessToken, userController.signInUser);

export default router;
