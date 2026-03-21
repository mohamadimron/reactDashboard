const prisma = require('../utils/db');
const { hashPassword } = require('../utils/auth');

// Get all users (with pagination and search)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const { roleId, statusId, activity } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    };

    if (roleId) where.AND.push({ roleId });
    if (statusId) where.AND.push({ statusId });
    
    if (activity) {
      const now = new Date();
      if (activity === 'today') {
        const today = new Date(now.setHours(0,0,0,0));
        where.AND.push({ lastLogin: { gte: today } });
      } else if (activity === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        where.AND.push({ lastLogin: { gte: weekAgo } });
      } else if (activity === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        where.AND.push({ lastLogin: { gte: monthAgo } });
      } else if (activity === 'never') {
        where.AND.push({ lastLogin: null });
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { role: true, status: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Format for frontend
    const formattedUsers = users.map(u => ({
      ...u,
      role: u.role.name,
      status: u.status.name
    }));

    res.json({
      users: formattedUsers,
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
      include: { role: true, status: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const formatted = {
      ...user,
      role: user.role.name,
      status: user.status.name
    };
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, roleId, statusId } = req.body;

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
        roleId,
        statusId
      },
      include: { role: true, status: true }
    });

    res.status(201).json({
      ...user,
      role: user.role.name,
      status: user.status.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, roleId, password, statusId } = req.body;

    let updateData = { name, email, roleId, statusId };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { role: true, status: true }
    });

    res.json({
      ...user,
      role: user.role.name,
      status: user.status.name
    });
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

// Helper endpoints for frontend dropdowns
const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getStatuses = async (req, res) => {
  try {
    const statuses = await prisma.status.findMany();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const adminUsers = await prisma.user.count({ where: { roleId: adminRole.id } });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLastWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    res.json({ totalUsers, adminUsers, newUsersLastWeek });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email },
      include: { role: true, status: true }
    });
    res.json({ ...user, role: user.role.name, status: user.status.name });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const isMatch = await require('../utils/auth').comparePassword(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });
    const hashedPassword = await require('../utils/auth').hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashedPassword } });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarPath },
      include: { role: true, status: true }
    });
    res.json({ ...user, role: user.role.name, status: user.status.name });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getStats, updateProfile, updatePassword, uploadAvatar, getRoles, getStatuses };
