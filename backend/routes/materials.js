const express = require('express');
const { getAll, create, download, remove, getStats } = require('../controllers/materialController');
const { authenticate, requirePermission } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/stats',     requirePermission('materials:download'), getStats);
router.get('/',          requirePermission('materials:download'), getAll);
router.post('/',         requirePermission('content:upload'), create);
router.put('/:id/download', requirePermission('materials:download'), download);
router.delete('/:id',    requirePermission('content:upload'), remove);

module.exports = router;