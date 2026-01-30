import express from 'express';
import authRoutes from './authRoutes.js';
import requestRoutes from './requestRoutes.js';
import userRoutes from './userRoutes.js';
import dbInstanceRoutes from './dbInstanceRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/requests', requestRoutes);
router.use('/users', userRoutes);
router.use('/db-instances', dbInstanceRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
