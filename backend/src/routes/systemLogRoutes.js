const express = require('express');
const { getSystemLogs, createFrontendLog, deleteSystemLog, clearSystemLogs } = require('../controllers/systemLogController');
const { protect, checkPermission, optionalProtect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/client', optionalProtect, createFrontendLog);
router.get('/', protect, checkPermission('canViewLogs'), getSystemLogs);
router.delete('/:id', protect, admin, deleteSystemLog);
router.delete('/', protect, admin, clearSystemLogs);

module.exports = router;
