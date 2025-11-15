const User = require('../models/User');

// Middleware to check if user is admin
const adminOnly = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Get user from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // Check if user is admin (you can customize this logic)
    // For now, checking if user has admin field or is a specific user
    const isAdmin = user.isAdmin || 
                   user.role === 'admin' || 
                   user.username === 'admin' ||
                   user.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      return res.status(403).json({ 
        msg: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { adminOnly };