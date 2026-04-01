const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: String,
  course:      { type: String, required: true },
  subject:     String,
  assignment:  String,
  gradeValue:  { type: String, required: true }, // A+, B, 92/100
  gradeType:   { type: String, enum: ['assignment','midterm','final','quiz','project'], default: 'assignment' },
  gradedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedByName:String,
  notes:       String,
  isFinal:     { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);