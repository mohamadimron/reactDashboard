const express = require('express');
const { getAuthLogs, deleteAuthLog } = require('../controllers/logController');
const { protect, checkPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, checkPermission('canViewLogs'), getAuthLogs);
router.delete('/:id', protect, checkPermission('canViewLogs'), deleteAuthLog);

module.exports = router;
