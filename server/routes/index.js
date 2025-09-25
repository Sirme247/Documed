import express from 'express';

import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';
// import patientRecordsRoutes from './patientRecordsRoutes.js';
import visitRoutes from './visitRoutes.js';
// import aiRoutes from './aiRoutes.js';
// import providerRoutes from './providerRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
// import auditRoutes from './auditRoutes.js';
// import accessRoutes from './accessRoutes.js';
// import exportRoutes from './exportRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hospitals', hospitalRoutes);
// router.use('/providers', providerRoutes);
router.use('/patients', patientRoutes);
// router.use('/patients', patientRecordsRoutes);
router.use('/visits', visitRoutes);
// router.use('/ai', aiRoutes);
// router.use('/audits', auditRoutes);
// router.use('/access', accessRoutes);
// router.use('/export', exportRoutes);

export default router;