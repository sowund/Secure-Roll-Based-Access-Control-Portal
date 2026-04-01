const mongoose = require('mongoose');

const SUBJECTS = [
  'Mathematics','Computer Science','Physics','Chemistry',
  'Biology','English','History','Economics','Engineering'
];

// Map department names → subject enum values (they match exactly in this system)
const DEPT_TO_SUBJECT = {
  'Computer Science': 'Computer Science',
  'Mathematics':      'Mathematics',
  'Physics':          'Physics',
  'Chemistry':        'Chemistry',
  'Biology':          'Biology',
  'English':          'English',
  'History':          'History',
  'Economics':        'Economics',
  'Engineering':      'Engineering',
  'Business':         'Economics', // closest match
};

const assignmentSchema = new mongoose.Schema({
  title:              { type: String, required: true, trim: true },
  course:             { type: String, required: true },
  subject:            { type: String, required: true, enum: SUBJECTS },
  // Which departments this assignment targets — empty array = all departments
  targetDepartments:  [{ type: String }],
  description:        { type: String, default: '' },
  dueDate:            { type: Date },
  totalMarks:         { type: Number, default: 100 },
  status:             { type: String, enum:['open','submitted','graded','closed'], default:'open' },
  priority:           { type: String, enum:['low','medium','high'], default:'medium' },
  // Created by faculty/TA
  createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName:      String,
  createdByRole:      String,
  // Student submission
  submittedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName:    String,
  submittedAt:        Date,
  submissionText:     String,
  // Grading
  gradedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedByName:       String,
  grade:              String,
  feedback:           String,
  isFinalGrade:       { type: Boolean, default: false }
}, { timestamps: true });

assignmentSchema.statics.DEPT_TO_SUBJECT = DEPT_TO_SUBJECT;
assignmentSchema.statics.SUBJECTS = SUBJECTS;

module.exports = mongoose.model('Assignment', assignmentSchema);