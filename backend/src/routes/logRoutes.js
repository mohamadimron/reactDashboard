const express = require('express');
const { getAuthLogs, deleteAuthLog } = require('../controllers/logController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAuthLogs);
router.delete('/:id', protect, admin, deleteAuthLog);

module.exports = router;
