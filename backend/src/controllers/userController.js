import User from '../models/User.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-googleId')
      .populate('teamLeadId', 'name email')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team leads (for dropdown)
export const getTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.find({ 
      role: { $in: ['team_lead', 'admin'] },
      isActive: true 
    })
      .select('name email role')
      .sort({ name: 1 });

    res.json(teamLeads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role, teamLeadId } = req.body;

    if (!['developer', 'team_lead', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    if (role === 'developer' && teamLeadId) {
      user.teamLeadId = teamLeadId;
    } else {
      user.teamLeadId = undefined;
    }

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-googleId')
      .populate('teamLeadId', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
