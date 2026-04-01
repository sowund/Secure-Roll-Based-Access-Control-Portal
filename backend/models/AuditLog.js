const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName:   String,
  actorRole:   String,
  action:      { type: String, required: true },  // e.g. 'LOGIN', 'ROLE_CHANGED', 'GRADE_UPDATED'
  targetType:  String,  // 'User', 'Assignment', 'Grade', etc.
  targetId:    String,
  targetName:  String,
  details:     mongoose.Schema.Types.Mixed,
  ip:          String,
  severity:    { type: String, enum: ['info','warning','critical'], default: 'info' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditSchema);