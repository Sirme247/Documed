import express from 'express';
import {registerUser, passwordReset} from '../controllers/userController.js';

const router = express.Router();

router.post('/register-user', registerUser);
router.post("/forgot-password", passwordReset);


export default router;
