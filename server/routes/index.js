
import express from 'express';


import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';

import visitRoutes from './visitRoutes.js';
import aiRoutes from './aiRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
import auditRoutes from './auditRoutes.js';
import adminRoutes from './adminRoutes.js';

// import exportRoutes from './exportRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/ai', aiRoutes);
router.use('/audits', auditRoutes);
// router.use('/export', exportRoutes);


export default router;


