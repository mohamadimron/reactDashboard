const express = require('express');
const { getSystemSettings, getPublicSystemSettings, updateSetting } = require('../controllers/settingsController');
const { uploadFavicon } = require('../controllers/uiSettingsController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');
const uiAssetUpload = require('../utils/uiAssetUpload');

const router = express.Router();
const handleFaviconUpload = (req, res, next) => {
  uiAssetUpload.single('favicon')(req, res, (error) => {
    if (!error) {
      return next();
    }

    return res.status(400).json({
      message: error.message || 'Invalid favicon upload request'
    });
  });
};

router.get('/public', getPublicSystemSettings);

// Only users with canManageSettings can access system configurations
router.get('/', protect, checkPermission('canManageSettings'), getSystemSettings);
router.put('/', protect, checkPermission('canManageSettings'), updateSetting);
router.post(
  '/favicon',
  protect,
  checkPermission('canManageSettings'),
  handleFaviconUpload,
  uploadFavicon
);

module.exports = router;
