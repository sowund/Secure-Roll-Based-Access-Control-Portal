const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'student', 'teaching_assistant', 'faculty',
  'registrar', 'admissions', 'finance', 'department_head',
  'helpdesk', 'security_officer', 'system_admin'
];

const ALL_PERMISSIONS = [
  // Student
  'grades:view_own', 'courses:register', 'materials:download',
  'assignments:submit', 'financial:view_own',
  // TA
  'assignments:grade', 'forums:manage',
  // Faculty
  'content:upload', 'assignments:manage', 'grades:input', 'roster:view',
  // Registrar
  'enrollment:manage', 'transcripts:manage', 'catalog:manage',
  // Admissions
  'applicants:manage', 'admissions:update',
  // Finance
  'billing:manage', 'payments:process', 'financial:manage',
  // Department Head
  'reports:department', 'faculty:manage', 'curriculum:approve',
  // Helpdesk
  'users:view', 'password:reset', 'issues:troubleshoot',
  // Security Officer
  'roles:manage', 'audit:view', 'access:monitor',
  // System Admin
  'system:configure', 'system:health', 'users:manage'
];

const ROLE_PERMISSIONS = {
  student:            ['grades:view_own','courses:register','materials:download','assignments:submit','financial:view_own'],
  teaching_assistant: ['assignments:grade','forums:manage','materials:download','roster:view'],
  faculty:            ['content:upload','assignments:manage','grades:input','roster:view','materials:download'],
  registrar:          ['enrollment:manage','transcripts:manage','catalog:manage','roster:view'],
  admissions:         ['applicants:manage','admissions:update'],
  finance:            ['billing:manage','payments:process','financial:manage'],
  department_head:    ['reports:department','faculty:manage','curriculum:approve','roster:view','grades:input'],
  helpdesk:           ['users:view','password:reset','issues:troubleshoot'],
  security_officer:   ['roles:manage','audit:view','access:monitor','users:view'],
  system_admin:       ALL_PERMISSIONS
};

const ROLE_LEVEL = {
  student:1, teaching_assistant:2, helpdesk:2,
  faculty:3, admissions:3, finance:3,
  registrar:4, department_head:5,
  security_officer:6, system_admin:7
};

// Self-registerable roles (no elevated privileges)
const SELF_REGISTER_ROLES = ['student','teaching_assistant','faculty'];

const userSchema = new mongoose.Schema({
  googleId:        { type: String, sparse: true, unique: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:            { type: String, required: true, trim: true },
  avatar:          { type: String, default: '' },
  password:        { type: String, minlength: 6, select: false },
  role:            { type: String, enum: ROLES, default: 'student' },
  permissions:     [{ type: String, enum: ALL_PERMISSIONS }],
  department:      { type: String, default: '' },
  studentId:       { type: String, default: '' },
  isActive:        { type: Boolean, default: true },
  authProvider:    { type: String, enum: ['local','google'], default: 'local' },
  lastLogin:       { type: Date },
  loginCount:      { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isNew || this.isModified('role')) {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
  }
  next();
});

userSchema.methods.comparePassword  = function(pwd) { return bcrypt.compare(pwd, this.password); };
userSchema.methods.hasPermission    = function(p)   { return this.permissions.includes(p); };
userSchema.methods.hasRole          = function(r)   { return (ROLE_LEVEL[this.role]||0) >= (ROLE_LEVEL[r]||99); };
userSchema.methods.toSafeObject     = function()    { const o=this.toObject(); delete o.password; return o; };
userSchema.statics.getRolePerms     = (r)           => ROLE_PERMISSIONS[r] || [];
userSchema.statics.getAllRoles      = ()            => ROLES;
userSchema.statics.getSelfRoles     = ()            => SELF_REGISTER_ROLES;
userSchema.statics.getRoleLevel     = (r)           => ROLE_LEVEL[r] || 0;
userSchema.statics.ALL_PERMISSIONS  = ALL_PERMISSIONS;
userSchema.statics.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

module.exports = mongoose.model('User', userSchema);