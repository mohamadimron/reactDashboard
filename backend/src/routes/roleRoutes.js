const express = require('express');
const { getAllRoles, createRole, deleteRole, updateRolePermissions } = require('../controllers/roleController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, checkPermission('canManageSettings'), getAllRoles)
  .post(protect, checkPermission('canManageSettings'), createRole);

router.route('/:id')
  .delete(protect, checkPermission('canManageSettings'), deleteRole);

router.route('/:id/permissions')
  .put(protect, checkPermission('canManageSettings'), updateRolePermissions);

module.exports = router;
