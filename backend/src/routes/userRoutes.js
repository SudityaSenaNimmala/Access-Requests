import express from 'express';
import {
  getAllUsers,
  getTeamLeads,
  updateUserRole,
  toggleUserStatus,
  getUser,
} from '../controllers/userController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (authenticated)
router.get('/team-leads', isAuthenticated, getTeamLeads);

// Admin routes
router.get('/', isAuthenticated, isAdmin, getAllUsers);
router.get('/:id', isAuthenticated, isAdmin, getUser);
router.patch('/:id/role', isAuthenticated, isAdmin, updateUserRole);
router.patch('/:id/toggle-status', isAuthenticated, isAdmin, toggleUserStatus);

export default router;
