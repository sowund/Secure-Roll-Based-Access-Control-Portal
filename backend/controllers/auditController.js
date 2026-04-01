const AuditLog = require('../models/AuditLog');

const getLogs = async (req, res) => {
  try {
    const { action, severity, actorRole, limit=50 } = req.query;
    const q = {};
    if (action)    q.action    = { $regex: action, $options:'i' };
    if (severity)  q.severity  = severity;
    if (actorRole) q.actorRole = actorRole;
    const logs = await AuditLog.find(q)
      .sort({ createdAt:-1 })
      .limit(parseInt(limit))
      .populate('actor','name email role');
    res.json({ success:true, logs });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const getStats = async (req, res) => {
  try {
    const total    = await AuditLog.countDocuments();
    const critical = await AuditLog.countDocuments({ severity:'critical' });
    const warnings = await AuditLog.countDocuments({ severity:'warning' });
    const today    = await AuditLog.countDocuments({ createdAt:{ $gte: new Date(new Date().setHours(0,0,0,0)) } });
    const byAction = await AuditLog.aggregate([
      { $group:{ _id:'$action', count:{$sum:1} } },
      { $sort:{ count:-1 } }, { $limit:10 }
    ]);
    res.json({ success:true, stats:{ total, critical, warnings, today, byAction } });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = { getLogs, getStats };