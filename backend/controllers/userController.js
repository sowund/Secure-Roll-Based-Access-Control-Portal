const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const logAudit = async (actor, action, targetType, targetId, targetName, details, severity='info') => {
  try {
    await AuditLog.create({
      actor: actor._id, actorName: actor.name, actorRole: actor.role,
      action, targetType, targetId: String(targetId), targetName, details, severity
    });
  } catch(e) { console.error('Audit log failed:', e.message); }
};

// GET all users (system_admin, security_officer, helpdesk)
const getUsers = async (req, res) => {
  try {
    const { search, role, isActive } = req.query;
    const q = {};
    if (search)   q.$or = [{ name:{$regex:search,$options:'i'} }, { email:{$regex:search,$options:'i'} }];
    if (role)     q.role = role;
    if (isActive !== undefined) q.isActive = isActive === 'true';
    const users = await User.find(q).sort({ createdAt: -1 }).select('-password');
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// GET stats
const getStats = async (req, res) => {
  try {
    const total    = await User.countDocuments();
    const active   = await User.countDocuments({ isActive: true });
    const byRole   = await User.aggregate([{ $group: { _id:'$role', count:{$sum:1} } }]);
    res.json({ success:true, stats: { total, active, byRole } });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// UPDATE user role (system_admin or security_officer only)
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allRoles = User.getAllRoles();
    if (!allRoles.includes(role)) return res.status(400).json({ success:false, message:'Invalid role' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success:false, message:'User not found' });

    const oldRole = target.role;
    target.role = role;
    await target.save();

    await logAudit(req.user, 'ROLE_CHANGED', 'User', target._id, target.name,
      { from: oldRole, to: role }, 'warning');

    res.json({ success:true, user: target.toSafeObject() });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// TOGGLE active status
const toggleActive = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success:false, message:'User not found' });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success:false, message:'Cannot deactivate yourself' });
    }
    target.isActive = !target.isActive;
    await target.save();
    await logAudit(req.user, target.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'User', target._id, target.name, {}, 'warning');
    res.json({ success:true, user: target.toSafeObject() });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// DELETE user (system_admin only)
const deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success:false, message:'User not found' });
    await User.findByIdAndDelete(req.params.id);
    await logAudit(req.user, 'USER_DELETED', 'User', target._id, target.name, {}, 'critical');
    res.json({ success:true, message:'User deleted' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const { name, department, studentId } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (studentId  !== undefined) user.studentId  = studentId;
    await user.save();
    res.json({ success:true, user: user.toSafeObject() });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// Reset password (helpdesk can trigger for others; anyone for themselves)
const resetPassword = async (req, res) => {
  try {
    const { newPassword, userId } = req.body;
    const targetId = userId || req.user._id;
    // Only helpdesk+ can reset others
    if (userId && userId !== String(req.user._id) && !req.user.hasPermission('password:reset')) {
      return res.status(403).json({ success:false, message:'Permission denied' });
    }
    const target = await User.findById(targetId).select('+password');
    if (!target) return res.status(404).json({ success:false, message:'User not found' });
    target.password = newPassword;
    await target.save();
    if (userId) await logAudit(req.user, 'PASSWORD_RESET', 'User', target._id, target.name, {}, 'warning');
    res.json({ success:true, message:'Password updated' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = { getUsers, getStats, updateRole, toggleActive, deleteUser, updateProfile, resetPassword };