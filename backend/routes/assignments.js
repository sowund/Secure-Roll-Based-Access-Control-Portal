const express = require('express');
const { getAll, create, submit, grade, remove, getStats } = require('../controllers/assignmentController');
const { authenticate, requirePermission, requireAnyPermission } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/stats', requireAnyPermission('assignments:submit','assignments:manage','assignments:grade'), getStats);
router.get('/',      requireAnyPermission('assignments:submit','assignments:manage','assignments:grade'), getAll);
router.post('/',     requireAnyPermission('assignments:manage','assignments:grade'), create);
router.put('/:id/submit', requirePermission('assignments:submit'), submit);
router.put('/:id/grade',  requireAnyPermission('grades:input','assignments:grade'), grade);
router.delete('/:id',     requireAnyPermission('assignments:manage'), remove);

module.exports = router;