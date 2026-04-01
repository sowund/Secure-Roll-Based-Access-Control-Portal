const express = require('express');
const { getLogs, getStats } = require('../controllers/auditController');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/stats', requirePermission('audit:view'), getStats);
router.get('/',      requirePermission('audit:view'), getLogs);

module.exports = router;