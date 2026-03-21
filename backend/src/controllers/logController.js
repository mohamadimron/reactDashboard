const prisma = require('../utils/db');

const getAuthLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, eventType, isSuspicious, startDate, endDate } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { usernameInput: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (isSuspicious !== undefined) {
      where.isSuspicious = isSuspicious === 'true';
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.authLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, role: true }
          }
        }
      }),
      prisma.authLog.count({ where })
    ]);

    res.json({
      logs,
      page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total
    });
  } catch (error) {
    console.error('[Logs] Get Logs Error:', error);
    res.status(500).json({ message: 'Server Error while fetching logs' });
  }
};

const deleteAuthLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.authLog.delete({
      where: { id }
    });
    res.json({ message: 'Log entry deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Log entry not found' });
    }
    console.error('[Logs] Delete Log Error:', error);
    res.status(500).json({ message: 'Server Error while deleting log' });
  }
};

module.exports = { getAuthLogs, deleteAuthLog };
