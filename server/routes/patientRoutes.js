import express from 'express';
import {registerPatient,addAllergies,addMedication,
    addChronicConditions,addFamilyHistory,addSocialHistory,updatePatient,updateSocialHistory,  
      updateAllergy,updateMedication,updateChronicCondition,updateFamilyHistory,getPatientFullProfile, deletePatient
    ,getPatients,getPatientById, searchPatientsInTheWeek, getFrequentlyCheckedPatientsThirtyDays, getAdmittedPatients,
  dischargePatient, deleteAllergy,deleteChronicCondition,deleteFamilyHistory,deleteMedication, reactivatePatient, hardDeletePatient} 
    from '../controllers/patientController.js';

import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware)

router.get('/get-patients', getPatients)

router.get('/search-patients-week', searchPatientsInTheWeek)
// router.get('/get-patient/:patient_id', getPatientFullProfile)
router.get('/get-patient/:patient_id', getPatientById)

router.put('/discharge-patient/:visit_id', dischargePatient)

router.get('/admitted-patients', getAdmittedPatients)
router.get('/frequently-checked-patients', getFrequentlyCheckedPatientsThirtyDays)


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
router.delete('/delete-patient/:patient_id',requireRole(1), deletePatient)
router.delete('/hard-delete-patient/:patient_id',requireRole(1), hardDeletePatient)



router.delete("/delete-allergy", deleteAllergy);
router.delete("/delete-medication", deleteMedication);
router.delete("/delete-family-history", deleteFamilyHistory);
router.delete("/delete-chronic-condition", deleteChronicCondition);

router.put('/reactivate-patient/:patient_id',requireRole(1), reactivatePatient);



export default router;
