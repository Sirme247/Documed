import express from 'express';
import { 
  uploadDicomMiddleware,
  uploadDicomStudy,
  getImagingStudy,
  getVisitImagingStudies,
  getPatientImagingHistory,
  updateImagingStudy,
  deleteImagingStudy,
  getStudyPreview,
  getOrthancStats
} from '../controllers/medicalImagingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Upload DICOM study (replaces individual image upload)
router.post('/upload-study', uploadDicomMiddleware, uploadDicomStudy);

// Get specific imaging study details
router.get('/studies/:imaging_study_id', getImagingStudy);

// Get all imaging studies for a visit
router.get('/visits/:visit_id/studies', getVisitImagingStudies);

// Get patient's imaging history (all studies)
router.get('/patients/:patient_id/studies', getPatientImagingHistory);

// Update study (findings/recommendations)
router.put('/studies/:imaging_study_id', updateImagingStudy);

// Delete study (cascades to series and instances)
router.delete('/studies/:imaging_study_id', deleteImagingStudy);

// Get study preview image (first instance)
router.get('/studies/:imaging_study_id/preview', getStudyPreview);

// Get Orthanc server statistics
router.get('/orthanc/stats', getOrthancStats);

// ===== BACKWARD COMPATIBILITY ROUTES (optional) =====
// If you want to keep old endpoints working, add aliases:

// Old: /upload -> New: /upload-study
router.post('/upload', uploadDicomMiddleware, uploadDicomStudy);

// Old: /:imaging_result_id -> New: /studies/:imaging_study_id
router.get('/:imaging_result_id', async (req, res, next) => {
  req.params.imaging_study_id = req.params.imaging_result_id;
  return getImagingStudy(req, res, next);
});

export default router;