import express from 'express';
import {
  createRequest,
  getDeveloperRequests,
  getTeamLeadRequests,
  getRequest,
  approveRequest,
  rejectRequest,
  getAllRequests,
  resubmitRequest,
} from '../controllers/requestController.js';
import { isAuthenticated, isTeamLeadOrAdmin, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Developer routes
router.post('/', isAuthenticated, createRequest);
router.get('/my-requests', isAuthenticated, getDeveloperRequests);
router.post('/:id/resubmit', isAuthenticated, resubmitRequest);

// Team lead routes
router.get('/team-requests', isAuthenticated, isTeamLeadOrAdmin, getTeamLeadRequests);
router.post('/:id/approve', isAuthenticated, isTeamLeadOrAdmin, approveRequest);
router.post('/:id/reject', isAuthenticated, isTeamLeadOrAdmin, rejectRequest);

// Admin routes
router.get('/all', isAuthenticated, isAdmin, getAllRequests);

// Common routes
router.get('/:id', isAuthenticated, getRequest);

export default router;
