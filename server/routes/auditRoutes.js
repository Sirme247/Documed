import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getUserAuditLogs,
  getPatientAuditLogs,
  getAuditStatistics,
  getRecentAuditLogs,
  exportAuditLogs,
  getHospitalAuditLogs
} from '../controllers/auditController.js';

import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
const router = express.Router();
router.use(authMiddleware);

router.get('/hospital-audit-logs', authMiddleware, getHospitalAuditLogs);

router.get('/audit-logs',requireRole(1,2), getAuditLogs);
router.get('/audit-logs/recent',requireRole(1,2), getRecentAuditLogs);
router.get('/audit-logs/statistics',requireRole(1,2), getAuditStatistics);
router.get('/audit-logs/export',requireRole(1,2), exportAuditLogs);
router.get('/audit-logs/:log_id',requireRole(1,2), getAuditLogById);
router.get('/audit-logs/user/:user_id',requireRole(1,2), getUserAuditLogs);
router.get('/audit-logs/patient/:patient_id',requireRole(1,2), getPatientAuditLogs);

export default router;