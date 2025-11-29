import express from 'express';
import {registerUser,
     passwordChange,
     getUser,
     selfRegister,
     adminResetPassword,
     adminUpdateUser,
     userUpdateUser,
    registerExistingMedicalPractitioner,deleteUser,getAllUsers,getUserDetails,getHospitalUsers,
    getUserProfile,
checkExistingPractitioner,searchDoctor, deactivateUser,reactivateUser,deleteUserPermanently} from '../controllers/userController.js';
import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();


// 1 - superadmin  
// 2 - localadmin  
// 3 - doctors,e.t.c
// 4 - nurse  
// 5 - receptionist 




router.get('/', authMiddleware, getUser);

router.get('/hospital-users', authMiddleware, requireRole(2), getHospitalUsers);
router.get('/list', authMiddleware, requireRole(1, 2), getAllUsers);
router.get('/user-details/:user_id', authMiddleware, requireRole(1,2), getUserDetails);

router.get('/user-profile', authMiddleware, getUserProfile);

router.delete('/delete-user/:user_id',authMiddleware, requireRole(1,2), deleteUser);
router.post('/register-user', authMiddleware, requireRole(1,2),  registerUser);
router.put("/change-password", authMiddleware, passwordChange);
router.put('/admin-reset-password',authMiddleware, requireRole(1, 2), adminResetPassword);
router.put('/admin-update-user',authMiddleware, requireRole(1, 2), adminUpdateUser);
router.put('/self-update',authMiddleware, userUpdateUser);
router.post('/self-register', selfRegister);
// router.post('/register-existing-doctor',authMiddleware, requireRole(1,2), registerExistingMedicalPractitioner);
router.get('/check-existing-practitioner', authMiddleware, checkExistingPractitioner);
router.get('/search-doctor', authMiddleware, searchDoctor);
router.post('/register-existing-practitioner', authMiddleware, registerExistingMedicalPractitioner);

router.put('/deactivate-user/:user_id', authMiddleware, requireRole(1,2), deactivateUser);
router.put('/reactivate-user/:user_id', authMiddleware, requireRole(1,2), reactivateUser);
router.delete('/delete-user-permanently/:user_id', authMiddleware, requireRole(1), deleteUserPermanently);


export default router;
