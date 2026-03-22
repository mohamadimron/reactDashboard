const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, getStats, updateProfile, updatePassword, uploadAvatar, getRoles, getStatuses, searchUsers } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');

const router = express.Router();

router.route('/')
  .get(protect, getUsers)
  .post(protect, admin, createUser);

router.route('/roles').get(protect, admin, getRoles);
router.route('/statuses').get(protect, admin, getStatuses);
router.route('/search').get(protect, searchUsers);

router.route('/stats')
  .get(protect, getStats);

router.route('/profile')
  .put(protect, updateProfile);

router.route('/profile/password')
  .put(protect, updatePassword);

router.route('/profile/avatar')
  .put(protect, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, uploadAvatar);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
