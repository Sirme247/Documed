import express from 'express';
import {registerPatient,addAllergies,addMedication,
    addChronicConditions,addFamilyHistory,addSocialHistory} from '../controllers/patientController.js';

const router = express.Router();

router.post('/register-patient', registerPatient);
router.post('/add-allergies', addAllergies);
router.post('/add-medication', addMedication);
router.post('/add-chronic-conditions', addChronicConditions);
router.post('/add-family-history', addFamilyHistory);
router.post('/add-social-history', addSocialHistory);

export default router;
