require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const session  = require('express-session');
const passport = require('passport');

require('./config/passport');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-rbac')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/materials',   require('./routes/materials'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/audit',       require('./routes/audit'));

// System info endpoint (system_admin only — handled in route)
const { authenticate, requirePermission } = require('./middleware/auth');
app.get('/api/system/health', authenticate, requirePermission('system:health'), async (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.get('/api/roles', authenticate, (req, res) => {
  const User = require('./models/User');
  res.json({ success:true, roles: User.getAllRoles(), rolePermissions: User.ROLE_PERMISSIONS });
});

app.get('/', (req, res) => res.json({ message: 'Academic RBAC Portal API', version: '2.0' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));