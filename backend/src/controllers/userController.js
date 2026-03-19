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
        id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
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
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
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
    const { name, email, password, role } = req.body;
    
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'USER' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    let updateData = { name, email, role };
    
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
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

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getStats };
