import express from 'express';
import { registerVisit,recordVitals,recordDiagnosis,
    recordTreatments,recordVisitPrescriptions,
    RecordLabTests,recordImagingResults
} from '../controllers/visitController.js';

const router = express.Router();

router.post('/register-visit', registerVisit);
router.post('/record-vitals', recordVitals);
router.post('/record-diagnosis', recordDiagnosis);
router.post('/record-treatments', recordTreatments);
router.post('/record-visit-prescriptions', recordVisitPrescriptions);
router.post('/record-lab-tests', RecordLabTests);
router.post('/record-imaging-results', recordImagingResults);

export default router;
