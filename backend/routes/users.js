const express = require('express');
const { getUsers, getStats, updateRole, toggleActive, deleteUser, updateProfile, resetPassword } = require('../controllers/userController');
const { authenticate, requirePermission, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/stats',       requirePermission('users:view'), getStats);
router.get('/',            requirePermission('users:view'), getUsers);
router.put('/profile',     updateProfile);
router.put('/password',    resetPassword);
router.put('/:id/role',    requirePermission('roles:manage'), updateRole);
router.put('/:id/toggle',  requirePermission('users:manage'), toggleActive);
router.delete('/:id',      requirePermission('users:manage'), deleteUser);

module.exports = router;