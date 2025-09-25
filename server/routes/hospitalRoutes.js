import express from 'express';
import{registerHospital,registerHospitalBranch} from '../controllers/hospitalController.js';

const router = express.Router();

router.post('/register-hospital', registerHospital);
router.post('/register-hospital-branch', registerHospitalBranch);

export default router;
