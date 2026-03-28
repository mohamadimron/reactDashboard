const express = require('express');
const { getSystemSettings, updateSetting } = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

// Only users with canManageSettings can access system configurations
router.get('/', protect, checkPermission('canManageSettings'), getSystemSettings);
router.put('/', protect, checkPermission('canManageSettings'), updateSetting);

module.exports = router;
