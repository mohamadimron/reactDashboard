const prisma = require('./db');
const pool = prisma.pool;
const { randomUUID } = require('crypto');

const SYSTEM_LOG_SOURCE = {
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND'
};

const SYSTEM_LOG_TYPE = {
  EVENT: 'EVENT',
  ERROR: 'ERROR'
};

const SYSTEM_LOG_LEVEL = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const MAX_TEXT_LENGTH = 10000;

const ensureSystemLogsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SystemLog" (
      "id" TEXT PRIMARY KEY,
      "source" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "level" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "method" TEXT,
      "path" TEXT,
      "statusCode" INTEGER,
      "userId" TEXT,
      "userName" TEXT,
      "userRole" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "metadata" JSONB,
      "stack" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure userName column exists for existing tables
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SystemLog' AND column_name='userName') THEN
        ALTER TABLE "SystemLog" ADD COLUMN "userName" TEXT;
      END IF;
    END
    $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_createdAt_idx" ON "SystemLog" ("createdAt" DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_type_idx" ON "SystemLog" ("type")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_level_idx" ON "SystemLog" ("level")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_source_idx" ON "SystemLog" ("source")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_category_idx" ON "SystemLog" ("category")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS "SystemLog_statusCode_idx" ON "SystemLog" ("statusCode")`);
};

const truncateText = (value, fallback = '') => {
  const text = String(value ?? fallback);
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_TEXT_LENGTH)}...[truncated]`;
};

const safeJson = (value) => {
  if (value === undefined || value === null) return null;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { serializationError: 'Metadata could not be serialized' };
  }
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const createSystemLog = async ({
  source = SYSTEM_LOG_SOURCE.BACKEND,
  type = SYSTEM_LOG_TYPE.EVENT,
  level = SYSTEM_LOG_LEVEL.INFO,
  category = 'system',
  action = 'unknown',
  message = '',
  method = null,
  path = null,
  statusCode = null,
  userId = null,
  userName = null,
  userRole = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
  stack = null
}) => {
  await ensureSystemLogsTable();

  const log = {
    id: randomUUID(),
    source: truncateText(source, SYSTEM_LOG_SOURCE.BACKEND),
    type: truncateText(type, SYSTEM_LOG_TYPE.EVENT),
    level: truncateText(level, SYSTEM_LOG_LEVEL.INFO),
    category: truncateText(category, 'system'),
    action: truncateText(action, 'unknown'),
    message: truncateText(message || action || 'System log entry'),
    method: method ? truncateText(method) : null,
    path: path ? truncateText(path) : null,
    statusCode: Number.isInteger(statusCode) ? statusCode : null,
    userId: userId ? truncateText(userId) : null,
    userName: userName ? truncateText(userName) : null,
    userRole: userRole ? truncateText(userRole) : null,
    ipAddress: ipAddress ? truncateText(ipAddress) : null,
    userAgent: userAgent ? truncateText(userAgent) : null,
    metadata: safeJson(metadata),
    stack: stack ? truncateText(stack) : null
  };

  await pool.query(`
    INSERT INTO "SystemLog" (
      "id", "source", "type", "level", "category", "action", "message",
      "method", "path", "statusCode", "userId", "userName", "userRole", "ipAddress",
      "userAgent", "metadata", "stack"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16::jsonb, $17
    )
  `, [
    log.id,
    log.source,
    log.type,
    log.level,
    log.category,
    log.action,
    log.message,
    log.method,
    log.path,
    log.statusCode,
    log.userId,
    log.userName,
    log.userRole,
    log.ipAddress,
    log.userAgent,
    log.metadata ? JSON.stringify(log.metadata) : null,
    log.stack
  ]);

  return log;
};

const logSystemEvent = (entry) => createSystemLog({
  ...entry,
  type: SYSTEM_LOG_TYPE.EVENT,
  level: entry.level || SYSTEM_LOG_LEVEL.INFO
});

const logSystemError = (entry) => createSystemLog({
  ...entry,
  type: SYSTEM_LOG_TYPE.ERROR,
  level: entry.level || SYSTEM_LOG_LEVEL.ERROR
});

const buildRequestLogEntry = (req, res, elapsedMs) => {
  const statusCode = res.statusCode;
  const isError = statusCode >= 500;
  const isWarning = statusCode >= 400 && statusCode < 500;
  const category = req.path.startsWith('/api/auth')
    ? 'auth'
    : req.path.startsWith('/api/settings')
      ? 'settings'
      : req.path.startsWith('/api/users')
        ? 'users'
        : req.path.startsWith('/api/messages')
          ? 'messages'
          : req.path.startsWith('/api/roles')
            ? 'roles'
            : req.path.startsWith('/api/system-logs')
              ? 'system-logs'
              : 'api';

  return {
    source: SYSTEM_LOG_SOURCE.BACKEND,
    type: isError ? SYSTEM_LOG_TYPE.ERROR : SYSTEM_LOG_TYPE.EVENT,
    level: isError ? SYSTEM_LOG_LEVEL.ERROR : isWarning ? SYSTEM_LOG_LEVEL.WARN : SYSTEM_LOG_LEVEL.INFO,
    category,
    action: `${req.method} ${req.path}`,
    message: `${req.method} ${req.originalUrl} completed with ${statusCode}`,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?.userId || null,
    userName: req.user?.userName || null,
    userRole: req.user?.role || null,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    metadata: {
      elapsedMs,
      query: req.query,
      contentLength: res.getHeader('content-length') || null
    }
  };
};

const shouldSkipRequestLog = (req) => {
  if (!req.path.startsWith('/api')) return true;
  if (req.method === 'OPTIONS') return true;
  if (req.path.startsWith('/api/uploads')) return true;
  if (req.path === '/api/auth/me') return true;
  if (req.path === '/api/settings/public') return true;
  if (req.path === '/api/system-logs/client') return true;

  // Requirement: Do not log access to system-logs page (any method)
  if (req.path.startsWith('/api/system-logs')) return true;

  return false;
};

const systemRequestLogger = (req, res, next) => {
  if (shouldSkipRequestLog(req)) {
    return next();
  }

  const startedAt = Date.now();
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const isError = statusCode >= 500;
    
    // Requirement: ADMIN activities only logged if error occurs
    if (req.user?.role === 'ADMIN' && !isError) {
      return;
    }

    const elapsedMs = Date.now() - startedAt;
    const entry = buildRequestLogEntry(req, res, elapsedMs);
    createSystemLog(entry).catch((error) => {
      console.error('[SystemLog] Request log failed:', error.message);
    });
  });

  return next();
};

const logUnhandledBackendError = (err, req, statusCode = 500) => {
  return logSystemError({
    source: SYSTEM_LOG_SOURCE.BACKEND,
    category: 'backend-error',
    action: `${req.method} ${req.path}`,
    message: err.message || 'Unhandled backend error',
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?.userId || null,
    userName: req.user?.userName || null,
    userRole: req.user?.role || null,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    metadata: {
      name: err.name,
      code: err.code,
      query: req.query
    },
    stack: err.stack || null
  });
};

module.exports = {
  SYSTEM_LOG_SOURCE,
  SYSTEM_LOG_TYPE,
  SYSTEM_LOG_LEVEL,
  ensureSystemLogsTable,
  createSystemLog,
  logSystemEvent,
  logSystemError,
  systemRequestLogger,
  logUnhandledBackendError,
  getClientIp
};
