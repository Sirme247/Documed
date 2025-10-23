import express from 'express';
import { signInUser,doctorSelectHospital } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js'
// import { registerUser} from '../controllers/userController.js';

const router = express.Router();

router.post('/doctor-select-hospital', authMiddleware, doctorSelectHospital);


router.post('/sign-in', signInUser);
// router.post('/doctor-select-hospital', doctorSelectHospital);

// router.post('/sign-up', registerUser)


export default router;
