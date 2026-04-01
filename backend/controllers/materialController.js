const CourseMaterial = require('../models/CourseMaterial');

const getAll = async (req, res) => {
  try {
    const { course, type, search } = req.query;
    const q = {};
    if (course)  q.course = { $regex: course, $options:'i' };
    if (type)    q.type   = type;
    if (search)  q.title  = { $regex: search, $options:'i' };
    const items = await CourseMaterial.find(q).sort({ createdAt:-1 }).populate('uploadedBy','name role');
    res.json({ success:true, items });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const create = async (req, res) => {
  try {
    const { title, course, subject, type, description, fileUrl } = req.body;
    if (!title || !course) return res.status(400).json({ success:false, message:'Title and course required' });
    const item = await CourseMaterial.create({
      title, course, subject, type:type||'notes', description, fileUrl:fileUrl||'',
      uploadedBy: req.user._id, uploadedByName: req.user.name, uploadedByRole: req.user.role
    });
    res.status(201).json({ success:true, item });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const download = async (req, res) => {
  try {
    const item = await CourseMaterial.findByIdAndUpdate(
      req.params.id, { $inc:{ downloads:1 } }, { new:true }
    );
    if (!item) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, item });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const remove = async (req, res) => {
  try {
    await CourseMaterial.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'Deleted' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const getStats = async (req, res) => {
  try {
    const total     = await CourseMaterial.countDocuments();
    const downloads = await CourseMaterial.aggregate([{ $group:{ _id:null, sum:{$sum:'$downloads'} } }]);
    const byType    = await CourseMaterial.aggregate([{ $group:{ _id:'$type', count:{$sum:1} } }]);
    res.json({ success:true, stats:{ total, downloads: downloads[0]?.sum||0, byType } });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = { getAll, create, download, remove, getStats };