import User from '../models/User.js';

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const user = await User.findById(req.user._id)
      .populate('teamLeadId', 'name email')
      .select('-microsoftId');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};

// Microsoft OAuth callback success
export const microsoftCallback = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
};
