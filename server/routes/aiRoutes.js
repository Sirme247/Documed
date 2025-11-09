import express from 'express';
import {PatientAISummary} from '../controllers/AI_controller.js'


import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router()
router.use(authMiddleware);


router.get('/ai-summary', PatientAISummary);

export default router;