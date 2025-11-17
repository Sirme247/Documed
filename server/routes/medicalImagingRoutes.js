import express from 'express';
import { 
  uploadDicomMiddleware,
  uploadDicomImages,
  getImagingResult,
  getVisitImagingResults,
  getImagingPreview,
  getImagingThumbnail,
  downloadDicom,
  updateImagingResult,
  deleteImagingResult,
  getPatientImagingHistory,
  getOrthancStats
} from '../controllers/medicalImagingController.js';
import { authMiddleware, requireRole} from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload DICOM files
router.post('/upload', 
  authMiddleware, 
  requireRole(1, 2, 3, 4, 5), // Admins, Doctors, Nurses
//   authMiddleware,
  uploadDicomMiddleware,
  uploadDicomImages
);

// Get single imaging result
router.get('/:imaging_result_id', 
  authMiddleware, 
  getImagingResult
);

// Get all imaging results for a visit
router.get('/visit/:visit_id', 
  authMiddleware, 
  getVisitImagingResults
);

// Get patient's imaging history
router.get('/patient/:patient_id/history', 
  authMiddleware, 
  getPatientImagingHistory
);

// Get preview image (PNG)
router.get('/:imaging_result_id/preview', 
  authMiddleware, 
  getImagingPreview
);

// Get thumbnail
router.get('/:imaging_result_id/thumbnail', 
  authMiddleware, 
  getImagingThumbnail
);

// Download DICOM file
router.get('/:imaging_result_id/download', 
  authMiddleware, 
  downloadDicom
);

// Update imaging result (findings/recommendations)
router.put('/:imaging_result_id', 
  authMiddleware, 
  requireRole(1, 2, 3), // Admins and Doctors only
  updateImagingResult
);

// Delete imaging result
router.delete('/:imaging_result_id', 
  authMiddleware, 
  requireRole(1, 2), // Admins only
  deleteImagingResult
);

// Get Orthanc server statistics (Admin only)
router.get('/orthanc/stats', 
  authMiddleware, 
  requireRole(1), 
  getOrthancStats
);



export default router;