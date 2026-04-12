const prisma = require('../utils/db');
const pool = prisma.pool;
const {
  SYSTEM_LOG_LEVEL,
  SYSTEM_LOG_SOURCE,
  SYSTEM_LOG_TYPE,
  createSystemLog,
  ensureSystemLogsTable,
  getClientIp
} = require('../utils/systemLogger');

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const parseMetadata = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
};

const getSystemLogs = async (req, res) => {
  try {
    await ensureSystemLogsTable();

    const page = toPositiveInt(req.query.page, 1, 100000);
    const limit = toPositiveInt(req.query.limit, 20, 100);
    const skip = (page - 1) * limit;
    const {
      search,
      source,
      type,
      level,
      category,
      startDate,
      endDate
    } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    const addCondition = (condition, value) => {
      conditions.push(condition.replace('?', `$${paramIndex++}`));
      params.push(value);
    };

    if (search) {
      const value = `%${String(search).trim()}%`;
      conditions.push(`(
        "message" ILIKE $${paramIndex}
        OR "action" ILIKE $${paramIndex}
        OR "path" ILIKE $${paramIndex}
        OR "userId" ILIKE $${paramIndex}
        OR "userRole" ILIKE $${paramIndex}
        OR "ipAddress" ILIKE $${paramIndex}
        OR "metadata"::text ILIKE $${paramIndex}
      )`);
      params.push(value);
      paramIndex += 1;
    }

    if (source) addCondition(`"source" = ?`, String(source).toUpperCase());
    if (type) addCondition(`"type" = ?`, String(type).toUpperCase());
    if (level) addCondition(`"level" = ?`, String(level).toUpperCase());
    if (category) addCondition(`"category" = ?`, String(category));

    if (startDate) {
      addCondition(`"createdAt" >= ?`, new Date(startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      addCondition(`"createdAt" <= ?`, end);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const logsParams = [...params, limit, skip];
    const limitIndex = paramIndex;
    const skipIndex = paramIndex + 1;

    const [logsResult, countResult, categoriesResult] = await Promise.all([
      pool.query(`
        SELECT
          "id", "source", "type", "level", "category", "action", "message",
          "method", "path", "statusCode", "userId", "userRole", "ipAddress",
          "userAgent", "metadata", "stack", "createdAt"
        FROM "SystemLog"
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT $${limitIndex}
        OFFSET $${skipIndex}
      `, logsParams),
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM "SystemLog"
        ${whereClause}
      `, params),
      pool.query(`
        SELECT DISTINCT "category"
        FROM "SystemLog"
        ORDER BY "category" ASC
      `)
    ]);

    const total = countResult.rows[0]?.total || 0;

    res.json({
      logs: logsResult.rows,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalLogs: total,
      filters: {
        sources: Object.values(SYSTEM_LOG_SOURCE),
        types: Object.values(SYSTEM_LOG_TYPE),
        levels: Object.values(SYSTEM_LOG_LEVEL),
        categories: categoriesResult.rows.map((row) => row.category)
      }
    });
  } catch (error) {
    console.error('[SystemLogs] Fetch Error:', error);
    res.status(500).json({ message: 'Server Error while fetching system logs' });
  }
};

const createFrontendLog = async (req, res) => {
  try {
    const {
      type,
      level,
      category,
      action,
      message,
      path,
      metadata,
      stack
    } = req.body || {};

    const normalizedType = String(type || SYSTEM_LOG_TYPE.EVENT).toUpperCase();
    const normalizedLevel = String(level || (normalizedType === SYSTEM_LOG_TYPE.ERROR ? SYSTEM_LOG_LEVEL.ERROR : SYSTEM_LOG_LEVEL.INFO)).toUpperCase();

    if (!Object.values(SYSTEM_LOG_TYPE).includes(normalizedType)) {
      return res.status(400).json({ message: 'Invalid log type' });
    }

    if (!Object.values(SYSTEM_LOG_LEVEL).includes(normalizedLevel)) {
      return res.status(400).json({ message: 'Invalid log level' });
    }

    await createSystemLog({
      source: SYSTEM_LOG_SOURCE.FRONTEND,
      type: normalizedType,
      level: normalizedLevel,
      category: String(category || 'frontend'),
      action: String(action || 'frontend_event'),
      message: String(message || action || 'Frontend log entry'),
      method: null,
      path: path ? String(path) : null,
      statusCode: null,
      userId: req.user?.userId || null,
      userRole: req.user?.role || null,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      metadata: parseMetadata(metadata),
      stack: stack ? String(stack) : null
    });

    res.status(201).json({ message: 'System log recorded' });
  } catch (error) {
    console.error('[SystemLogs] Frontend Log Error:', error);
    res.status(500).json({ message: 'Server Error while recording system log' });
  }
};

module.exports = {
  getSystemLogs,
  createFrontendLog
};
