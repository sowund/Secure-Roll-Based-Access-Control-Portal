const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success:false, message:'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+permissions');
    if (!user || !user.isActive) {
      return res.status(401).json({ success:false, message:'Invalid or inactive account' });
    }
    req.user = user;
    next();
  } catch(err) {
    res.status(401).json({ success:false, message:'Token invalid or expired' });
  }
};

const requirePermission = (...perms) => (req, res, next) => {
  const has = perms.every(p => req.user.hasPermission(p));
  if (!has) return res.status(403).json({ success:false, message:`Permission required: ${perms.join(', ')}` });
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  const ok = roles.some(r => req.user.hasRole(r));
  if (!ok) return res.status(403).json({ success:false, message:'Insufficient role level' });
  next();
};

const requireAnyPermission = (...perms) => (req, res, next) => {
  const has = perms.some(p => req.user.hasPermission(p));
  if (!has) return res.status(403).json({ success:false, message:'Access denied' });
  next();
};

module.exports = { authenticate, requirePermission, requireRole, requireAnyPermission };