import express from 'express';
import{registerHospital,registerHospitalBranch,updateHospital,updateHospitalBranch,getHospitalInformation,getBranchInformation,
    deactivateHospital,deactivateBranch,hardDeleteBranch,hardDeleteHospital} from '../controllers/hospitalController.js';
import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware)

// 1 - superadmin  
// 2 - localadmin  
// 3 - medicalprovider  
// 4 - nurse  
// 5 - receptionist 




router.get('/branches', getBranchInformation);


router.get('/hospitals/:hospital_id/branches', getBranchInformation);


router.get('/hospitals/:hospital_id/branches/:branch_id', getBranchInformation);

router.put('/hospitals/:hospital_id',requireRole(1), deactivateHospital);
router.put('/hospitals/:branch_id',requireRole(1), deactivateBranch);
router.delete('/hospitals/:hospital_id',requireRole(1), hardDeleteHospital);
router.delete('/hospitals/:branch_id',requireRole(1), hardDeleteBranch);

router.get('/hospitals', getHospitalInformation);
router.get('/hospitals/:hospital_id', getHospitalInformation);
router.post('/register-hospital', requireRole(1), registerHospital);
router.post('/register-hospital-branch', requireRole(1), registerHospitalBranch);
router.put('/update-hospital', requireRole(1), updateHospital);
router.put('/update-hospital-branch', requireRole(1), updateHospitalBranch);

export default router;
