import express from 'express';
import{registerHospital,registerHospitalBranch,updateHospital,updateHospitalBranch,
    deactivateHospital,deactivateBranch,hardDeleteBranch,hardDeleteHospital, reactivateHospital,reactivateHospitalBranch,
getAllHospitals,getAllBranches,getBranchById,getHospitalById,
getBranchesByHospital,currentHospitalDetails} from '../controllers/hospitalController.js';
import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware)

// 1 - superadmin  
// 2 - localadmin  
// 3 - medicalprovider  
// 4 - nurse  
// 5 - receptionist 


router.get('/hospitals/branches-details',requireRole(2), getBranchesByHospital);
router.get('/hospitals/current-hospital',requireRole(2), currentHospitalDetails);


router.get('/hospitals/list', getAllHospitals);
router.get('/hospitals/:hospital_id', getHospitalById);
router.get('/branches/list', getAllBranches);
router.get('/branches/:branch_id', getBranchById);


router.put('/hospitals/deactivate/:hospital_id',requireRole(1), deactivateHospital);
router.put('/branches/deactivate/:branch_id',requireRole(1), deactivateBranch);

router.put('/hospitals/reactivate/:hospital_id',requireRole(1), reactivateHospital);
router.put('/branches/reactivate/:branch_id',requireRole(1), reactivateHospitalBranch);

router.delete('/hospitals/delete/:hospital_id',requireRole(1), hardDeleteHospital);
router.delete('/branches/delete/:branch_id',requireRole(1), hardDeleteBranch);


router.post('/register-hospital', requireRole(1), registerHospital);
router.post('/register-hospital-branch', requireRole(1), registerHospitalBranch);
router.put('/update-hospital', requireRole(1), updateHospital);
router.put('/update-hospital-branch', requireRole(1), updateHospitalBranch);

export default router;
