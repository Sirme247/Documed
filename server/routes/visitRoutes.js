import express from 'express';
import { registerVisit,recordVitals,recordDiagnosis,
    recordTreatments,recordVisitPrescriptions,
    RecordLabTests,recordImagingResults,getVisitDetails,getPatientVisits,deleteVisit,
    getVisitsList,getHospitalVisitsForDay, visitsInHospital
} from '../controllers/visitController.js';

import {authMiddleware,requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware)

router.delete('/delete-visit/:visit_id',authMiddleware, requireRole(1,2),deleteVisit)
router.get('/get-visit/:visit_id', authMiddleware, getVisitDetails);
router.get('/visits',authMiddleware, getVisitsList);

router.get('/hospital/visits/day',authMiddleware, getHospitalVisitsForDay);

router.get('/hospital',authMiddleware, visitsInHospital);

router.get('/patient/:patient_id',authMiddleware, getPatientVisits);
router.post('/register-visit',authMiddleware, registerVisit);
router.post('/record-vitals',authMiddleware, recordVitals);
router.post('/record-diagnosis',authMiddleware, recordDiagnosis);
router.post('/record-treatment',authMiddleware, recordTreatments);
router.post('/record-visit-prescriptions',authMiddleware, recordVisitPrescriptions);
router.post('/record-lab-tests',authMiddleware, RecordLabTests);
router.post('/record-imaging-results',authMiddleware, recordImagingResults);

export default router;
