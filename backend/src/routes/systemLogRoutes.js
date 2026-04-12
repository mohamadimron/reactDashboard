const express = require('express');
const { getSystemLogs, createFrontendLog } = require('../controllers/systemLogController');
const { protect, checkPermission, optionalProtect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/client', optionalProtect, createFrontendLog);
router.get('/', protect, checkPermission('canViewLogs'), getSystemLogs);

module.exports = router;
