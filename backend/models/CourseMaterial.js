const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  course:        { type: String, required: true },
  subject:       String,
  type:          { type: String, enum:['syllabus','lecture','notes','textbook','video','other'], default:'notes' },
  description:   String,
  fileUrl:       { type: String, default: '' },
  uploadedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName:String,
  uploadedByRole:String,
  isPublic:      { type: Boolean, default: true },
  downloads:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CourseMaterial', materialSchema);