const prisma = require('../utils/db');
const { hashPassword } = require('../utils/auth');

// Get all users (with pagination and search)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    };

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
      });


    const total = await prisma.user.count({ where });

    res.json({
      users,
      page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single user
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, lastLogin: true, createdAt: true, updatedAt: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        role: role || 'USER',
        isActive: isActive !== undefined ? isActive : true
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password, isActive } = req.body;

    let updateData = { 
      name, 
      email, 
      role,
      isActive: isActive !== undefined ? isActive : undefined
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true }
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User removed' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Dashboard Stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
    const regularUsers = await prisma.user.count({ where: { role: 'USER' } });
    
    // Recent registrations in last 7 days (mock logic for demo)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersLastWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      newUsersLastWeek
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
}

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true, name: true, email: true, role: true, avatar: true, lastLogin: true, createdAt: true, updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update own password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await require('../utils/auth').comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }

    const hashedPassword = await require('../utils/auth').hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Upload Avatar
const uploadAvatar = async (req, res) => {
  try {
    console.log('Upload request received for user:', req.user?.userId);
    
    if (!req.file) {
      console.log('Multer req.file is missing');
      return res.status(400).json({ message: 'No file uploaded or file rejected by filter' });
    }

    const userId = req.user.userId;
    const avatarPath = `/uploads/${req.file.filename}`;
    console.log('New avatar path:', avatarPath);

    // Get current user to see if we should delete old avatar
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    
    if (currentUser && currentUser.avatar) {
        const fs = require('fs');
        const path = require('path');
        // Ensure path is relative to process.cwd() without leading slash
        const relativePath = currentUser.avatar.startsWith('/') ? currentUser.avatar.substring(1) : currentUser.avatar;
        const oldFilePath = path.join(process.cwd(), relativePath);
        
        console.log('Attempting to delete old avatar at:', oldFilePath);
        try {
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
                console.log('Old avatar deleted successfully');
            } else {
                console.log('Old avatar file not found on disk');
            }
        } catch (fileErr) {
            console.error('Non-critical error deleting old avatar:', fileErr.message);
        }
    }

    console.log('Updating database for user:', userId);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true, name: true, email: true, role: true, avatar: true, lastLogin: true, createdAt: true, updatedAt: true
      }
    });

    console.log('Database updated successfully');
    res.json(user);
  } catch (error) {
    console.error('CRITICAL UPLOAD ERROR:', error);
    res.status(500).json({ 
      message: 'Server Error during upload', 
      debug: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getStats, updateProfile, updatePassword, uploadAvatar };
