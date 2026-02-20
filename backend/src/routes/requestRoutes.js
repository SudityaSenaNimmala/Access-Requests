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
  getDeveloperFilterOptions,
  getTeamLeadFilterOptions,
  getAdminFilterOptions,
} from '../controllers/requestController.js';
import { isAuthenticated, isTeamLeadOrAdmin, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Developer routes
router.post('/', isAuthenticated, createRequest);
router.get('/my-requests', isAuthenticated, getDeveloperRequests);
router.get('/filter-options/developer', isAuthenticated, getDeveloperFilterOptions);
router.post('/:id/resubmit', isAuthenticated, resubmitRequest);

// Team lead routes
router.get('/team-requests', isAuthenticated, isTeamLeadOrAdmin, getTeamLeadRequests);
router.get('/filter-options/team-lead', isAuthenticated, isTeamLeadOrAdmin, getTeamLeadFilterOptions);
router.post('/:id/approve', isAuthenticated, isTeamLeadOrAdmin, approveRequest);
router.post('/:id/reject', isAuthenticated, isTeamLeadOrAdmin, rejectRequest);

// Admin routes
router.get('/all', isAuthenticated, isAdmin, getAllRequests);
router.get('/filter-options/admin', isAuthenticated, isAdmin, getAdminFilterOptions);

// Common routes
router.get('/:id', isAuthenticated, getRequest);

export default router;
