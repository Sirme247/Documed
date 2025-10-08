import express from 'express';
import {registerUser,
     passwordChange,
     getUser,
     selfRegister,
     adminResetPassword,
     adminUpdateUser,
     userUpdateUser,
    registerExistingMedicalPractitioner,deleteUser} from '../controllers/userController.js';
import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();


// 1 - superadmin  
// 2 - localadmin  
// 3 - doctors,e.t.c
// 4 - nurse  
// 5 - receptionist 




router.get('/', authMiddleware, getUser);

router.delete('/delete-user/:user_id',authMiddleware, requireRole(1,2), deleteUser);
router.post('/register-user', authMiddleware, requireRole(1,2),  registerUser);
router.put("/change-password", authMiddleware, passwordChange);
router.put('/admin-reset-password',authMiddleware, requireRole(1, 2), adminResetPassword);
router.put('/admin-update-user',authMiddleware, requireRole(1, 2), adminUpdateUser);
router.put('/self-update',authMiddleware, userUpdateUser);
router.post('/self-register', selfRegister);
router.post('/register-existing-doctor',authMiddleware, requireRole(1,2), registerExistingMedicalPractitioner);



export default router;
