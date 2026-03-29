const express = require('express');
const { getSystemSettings, getPublicSystemSettings, updateSetting } = require('../controllers/settingsController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/public', getPublicSystemSettings);

// Only users with canManageSettings can access system configurations
router.get('/', protect, checkPermission('canManageSettings'), getSystemSettings);
router.put('/', protect, checkPermission('canManageSettings'), updateSetting);

module.exports = router;
