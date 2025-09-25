import express from 'express';
import { signInUser } from '../controllers/authController.js';
// import { registerUser} from '../controllers/userController.js';

const router = express.Router();

router.post('/sign-in', signInUser);


export default router;
