const express = require('express');
const { getAll, registerCourse, manageEnrollment, updateEnrollment, getStats } = require('../controllers/enrollmentController');
const { authenticate, requirePermission, requireAnyPermission } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/stats',   requireAnyPermission('courses:register','enrollment:manage'), getStats);
router.get('/',        requireAnyPermission('courses:register','enrollment:manage','roster:view'), getAll);
router.post('/register', requirePermission('courses:register'), registerCourse);
router.post('/manage', requirePermission('enrollment:manage'), manageEnrollment);
router.put('/:id',     requirePermission('enrollment:manage'), updateEnrollment);

module.exports = router;