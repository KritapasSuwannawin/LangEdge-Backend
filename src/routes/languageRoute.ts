import express from 'express';
import languageController from '../controllers/languageController';

const router = express.Router();

router.route('/').get(languageController.getLanguage);

export default router;
