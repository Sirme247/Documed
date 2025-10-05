import express from 'express';
import {registerPatient,addAllergies,addMedication,
    addChronicConditions,addFamilyHistory,addSocialHistory,updatePatient,updateSocialHistory,  
      updateAllergy,updateMedication,updateChronicCondition,updateFamilyHistory,getPatientFullProfile} 
    from '../controllers/patientController.js';

import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware)

router.get('/get-patient/:patient_id',authMiddleware, getPatientFullProfile)
router.post('/register-patient', registerPatient);
router.post('/add-allergy', addAllergies);
router.post('/add-medication', addMedication);
router.post('/add-chronic-condition', addChronicConditions);
router.post('/add-family-history', addFamilyHistory);
router.post('/add-social-history', addSocialHistory);
router.put('/update-patient', updatePatient);
router.put('/update-social-history', updateSocialHistory);
router.put('/update-allergy', updateAllergy);
router.put('/update-medication', updateMedication);
router.put('/update-chronic-condition', updateChronicCondition);
router.put('/update-family-history', updateFamilyHistory);


export default router;
