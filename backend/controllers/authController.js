const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, studentId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success:false, message:'Name, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success:false, message:'Email already registered' });

    // Only allow self-registration for academic roles
    const selfRoles = User.getSelfRoles();
    const selectedRole = selfRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name, email, password,
      role: selectedRole,
      department: department || '',
      studentId:  studentId  || '',
      authProvider: 'local'
    });

    const token = generateToken(user._id);
    res.status(201).json({ success:true, token, user: user.toSafeObject() });
  } catch(err) {
    console.error('Register error:', err);
    res.status(500).json({ success:false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) return res.status(401).json({ success:false, message:'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success:false, message:'Account is deactivated' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success:false, message:'Invalid credentials' });

    user.lastLogin  = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success:true, token, user: user.toSafeObject() });
  } catch(err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success:true, user: user.toSafeObject() });
  } catch(err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// Google OAuth callback
const googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
};

module.exports = { register, login, getMe, googleCallback };