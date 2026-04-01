const Assignment = require('../models/Assignment');
const AuditLog   = require('../models/AuditLog');

// GET all — students only see assignments for their department
const getAll = async (req, res) => {
  try {
    const { subject, status, course, search } = req.query;
    const q = {};

    if (subject) q.subject = subject;
    if (status)  q.status  = status;
    if (course)  q.course  = { $regex: course, $options:'i' };
    if (search)  q.$or     = [
      { title:  { $regex: search, $options:'i' } },
      { course: { $regex: search, $options:'i' } }
    ];

    if (req.user.role === 'student') {
      const dept = req.user.department || '';

      // Assignment is visible to this student if:
      // (a) targetDepartments is empty/not set → assignment is for everyone
      // (b) targetDepartments includes this student's department
      // AND either status is 'open' OR the student themselves submitted it
      const deptFilter = {
        $or: [
          { targetDepartments: { $size: 0 } },          // no restriction
          { targetDepartments: { $exists: false } },     // legacy
          { targetDepartments: dept }                    // matches student dept
        ]
      };

      // Merge with existing query — must match dept filter AND be open or own submission
      const studentVisibility = {
        $and: [
          deptFilter,
          { $or: [{ status: 'open' }, { submittedBy: req.user._id }] }
        ]
      };

      // If search already set $or on q, we need to merge carefully
      if (q.$or) {
        const searchOr = q.$or;
        delete q.$or;
        q.$and = [{ $or: searchOr }, studentVisibility];
      } else {
        Object.assign(q, studentVisibility);
      }
    }

    const items = await Assignment.find(q)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name')
      .populate('gradedBy', 'name');

    res.json({ success: true, items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE — faculty/TA can target specific departments or all
const create = async (req, res) => {
  try {
    const { title, course, subject, description, dueDate,
            totalMarks, priority, targetDepartments } = req.body;

    if (!title || !course || !subject) {
      return res.status(400).json({ success: false, message: 'Title, course, and subject are required' });
    }

    const item = await Assignment.create({
      title, course, subject, description,
      dueDate,
      totalMarks:        totalMarks || 100,
      priority:          priority   || 'medium',
      // Normalize: empty string or undefined → [] (means all departments)
      targetDepartments: Array.isArray(targetDepartments)
                           ? targetDepartments.filter(Boolean)
                           : (targetDepartments ? [targetDepartments] : []),
      createdBy:         req.user._id,
      createdByName:     req.user.name,
      createdByRole:     req.user.role
    });

    res.status(201).json({ success: true, item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SUBMIT (student only) — also verify student's dept matches assignment target
const submit = async (req, res) => {
  try {
    const item = await Assignment.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (item.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Assignment is not open for submission' });
    }

    // Verify this student is allowed to submit (dept check)
    const dept = req.user.department || '';
    const targeted = item.targetDepartments && item.targetDepartments.length > 0;
    if (targeted && !item.targetDepartments.includes(dept)) {
      return res.status(403).json({ success: false, message: 'This assignment is not for your department' });
    }

    item.status          = 'submitted';
    item.submittedBy     = req.user._id;
    item.submittedByName = req.user.name;
    item.submittedAt     = new Date();
    item.submissionText  = req.body.submissionText || '';
    await item.save();

    res.json({ success: true, item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GRADE
const grade = async (req, res) => {
  try {
    const { grade, feedback, isFinal } = req.body;
    const isFinalBool = (isFinal === true || isFinal === 'true');

    const item = await Assignment.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    if (isFinalBool && req.user.role === 'teaching_assistant') {
      return res.status(403).json({ success: false, message: 'TAs cannot submit final grades' });
    }

    item.grade        = grade;
    item.feedback     = feedback || '';
    item.gradedBy     = req.user._id;
    item.gradedByName = req.user.name;
    item.isFinalGrade = isFinalBool && req.user.role === 'faculty';
    item.status       = 'graded';
    await item.save();

    await AuditLog.create({
      actor: req.user._id, actorName: req.user.name, actorRole: req.user.role,
      action: 'GRADE_SUBMITTED', targetType: 'Assignment',
      targetId: String(item._id), targetName: item.title,
      details: { grade, isFinal: item.isFinalGrade },
      severity: item.isFinalGrade ? 'warning' : 'info'
    });

    res.json({ success: true, item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STATS — for students: scoped to their department + their submissions
const getStats = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const dept = req.user.department || '';
      const deptFilter = {
        $or: [
          { targetDepartments: { $size: 0 } },
          { targetDepartments: { $exists: false } },
          { targetDepartments: dept }
        ]
      };
      const total     = await Assignment.countDocuments(deptFilter);
      const open      = await Assignment.countDocuments({ ...deptFilter, status: 'open' });
      const submitted = await Assignment.countDocuments({ submittedBy: req.user._id, status: 'submitted' });
      const graded    = await Assignment.countDocuments({ submittedBy: req.user._id, status: 'graded' });
      return res.json({ success: true, stats: { total, open, submitted, graded } });
    }

    // Faculty/TA/admin: global counts
    const total     = await Assignment.countDocuments();
    const open      = await Assignment.countDocuments({ status: 'open' });
    const submitted = await Assignment.countDocuments({ status: 'submitted' });
    const graded    = await Assignment.countDocuments({ status: 'graded' });
    res.json({ success: true, stats: { total, open, submitted, graded } });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, submit, grade, remove, getStats };