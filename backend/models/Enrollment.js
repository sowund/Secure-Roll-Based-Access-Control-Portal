const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName:  String,
  studentId:    String,
  course:       { type: String, required: true },
  subject:      String,
  semester:     { type: String, required: true },
  year:         { type: Number, default: new Date().getFullYear() },
  status:       { type: String, enum:['active','dropped','completed','waitlisted'], default:'active' },
  enrolledBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledByName: String,
  grade:        String,
  credits:      { type: Number, default: 3 }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);