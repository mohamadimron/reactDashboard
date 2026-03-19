const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, getStats } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getUsers)
  .post(protect, admin, createUser);

router.route('/stats')
  .get(protect, getStats);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
