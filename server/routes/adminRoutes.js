import express from 'express';

import { getAdminStatistics,getLocalAdminStatistics,getBranchStatistics, getHospitalUsers } from '../controllers/adminController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';  

const router = express.Router();

router.use(authMiddleware,);


// Local Admin/Hospital Admin Statistics (role_id = 2)
router.get('/hospital-statistics', requireRole(2), getLocalAdminStatistics);

router.get('/hospital-users', requireRole(2), getHospitalUsers);

// Branch Manager Statistics (role_id = 2, but filtered by branch)
router.get('/branch-statistics', requireRole(2), getBranchStatistics);


router.get('/statistics', requireRole(1), getAdminStatistics);

export default router;