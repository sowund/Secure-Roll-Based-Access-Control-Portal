const Enrollment = require('../models/Enrollment');

const getAll = async (req, res) => {
  try {
    const { status, semester, search } = req.query;
    const q = {};
    if (status)   q.status   = status;
    if (semester) q.semester = semester;
    // Students only see their own enrollments
    if (req.user.role === 'student') q.student = req.user._id;
    if (search) q.$or = [
      { course:{$regex:search,$options:'i'} },
      { studentName:{$regex:search,$options:'i'} }
    ];
    const items = await Enrollment.find(q).sort({ createdAt:-1 }).populate('student','name email studentId');
    res.json({ success:true, items });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// Student registers for a course
const registerCourse = async (req, res) => {
  try {
    const { course, subject, semester, credits } = req.body;
    if (!course || !semester) return res.status(400).json({ success:false, message:'Course and semester required' });
    const existing = await Enrollment.findOne({ student: req.user._id, course, semester });
    if (existing) return res.status(409).json({ success:false, message:'Already enrolled in this course' });
    const item = await Enrollment.create({
      student: req.user._id, studentName: req.user.name,
      studentId: req.user.studentId, course, subject, semester,
      credits: credits||3, enrolledBy: req.user._id, enrolledByName: req.user.name
    });
    res.status(201).json({ success:true, item });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// Registrar manages enrollment
const manageEnrollment = async (req, res) => {
  try {
    const { studentId, course, subject, semester, status, grade, credits } = req.body;
    const existing = await Enrollment.findOne({ student: studentId, course, semester });
    if (existing) {
      if (status)  existing.status  = status;
      if (grade)   existing.grade   = grade;
      if (credits) existing.credits = credits;
      await existing.save();
      return res.json({ success:true, item: existing });
    }
    const item = await Enrollment.create({
      student: studentId, course, subject, semester, status: status||'active',
      grade, credits: credits||3,
      enrolledBy: req.user._id, enrolledByName: req.user.name
    });
    res.status(201).json({ success:true, item });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const updateEnrollment = async (req, res) => {
  try {
    const item = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new:true });
    if (!item) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, item });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const getStats = async (req, res) => {
  try {
    const total     = await Enrollment.countDocuments();
    const active    = await Enrollment.countDocuments({ status:'active' });
    const completed = await Enrollment.countDocuments({ status:'completed' });
    const dropped   = await Enrollment.countDocuments({ status:'dropped' });
    res.json({ success:true, stats:{ total, active, completed, dropped } });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = { getAll, registerCourse, manageEnrollment, updateEnrollment, getStats };