// Check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized - Please login' });
};

// Check if user has specific role(s)
export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized - Please login' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }
  
  next();
};

// Check if user is team lead or admin
export const isTeamLeadOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized - Please login' });
  }
  
  if (!['team_lead', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden - Team Lead or Admin access required' });
  }
  
  next();
};
