import express from 'express';
import passport from 'passport';
import { getCurrentUser, logout, microsoftCallback } from '../controllers/authController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get current user
router.get('/me', isAuthenticated, getCurrentUser);

// Microsoft OAuth login
router.get('/microsoft', passport.authenticate('microsoft', {
  prompt: 'select_account'
}));

// Microsoft OAuth callback
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  microsoftCallback
);

// Logout
router.post('/logout', isAuthenticated, logout);

export default router;
