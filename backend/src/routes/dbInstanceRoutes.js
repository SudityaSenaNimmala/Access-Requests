import express from 'express';
import {
  getAllDBInstances,
  getDBInstance,
  createDBInstance,
  updateDBInstance,
  deleteDBInstance,
  testConnection,
} from '../controllers/dbInstanceController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (authenticated) - for dropdown
router.get('/', isAuthenticated, getAllDBInstances);
router.get('/:id', isAuthenticated, getDBInstance);

// Admin routes
router.post('/', isAuthenticated, isAdmin, createDBInstance);
router.put('/:id', isAuthenticated, isAdmin, updateDBInstance);
router.delete('/:id', isAuthenticated, isAdmin, deleteDBInstance);
router.post('/test-connection', isAuthenticated, isAdmin, testConnection);

export default router;
