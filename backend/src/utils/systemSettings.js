const prisma = require('./db');
const pool = prisma.pool;
const { randomUUID } = require('crypto');

const SYSTEM_SETTING_KEYS = {
  DEFAULT_REGISTRATION_ROLE: 'defaultRegistrationRole',
  REGISTER_PAGE_ENABLED: 'registerPageEnabled',
  REGISTER_MAX_PER_DAY: 'registerMaxPerDay',
  WEBSITE_TITLE: 'websiteTitle',
  WEBSITE_FAVICON_URL: 'websiteFaviconUrl'
};

const DEFAULT_PUBLIC_REGISTRATION_ROLE = 'USER';
const DEFAULT_REGISTER_PAGE_ENABLED = true;
const REGISTER_MAX_PER_DAY_OPTIONS = [5, 10, 20, 40, 60];
const DEFAULT_REGISTER_MAX_PER_DAY = 60;
const DEFAULT_REGISTRATION_LIMIT_TIME_ZONE = process.env.REGISTRATION_LIMIT_TIME_ZONE || 'Asia/Jakarta';
const DEFAULT_WEBSITE_TITLE = 'React Dashboard';
const DEFAULT_WEBSITE_FAVICON_URL = '/ui-assets/default-favicon.svg';

let systemSettingColumnsCache = null;

const ensureSystemSettingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SystemSetting" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE "SystemSetting"
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE "SystemSetting"
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  systemSettingColumnsCache = null;
};

const getSystemSettingColumns = async () => {
  if (systemSettingColumnsCache) {
    return systemSettingColumnsCache;
  }

  await ensureSystemSettingsTable();

  const { rows } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SystemSetting'
  `);

  systemSettingColumnsCache = new Set(rows.map((row) => row.column_name));
  return systemSettingColumnsCache;
};

const getSystemSettingsMap = async () => {
  await ensureSystemSettingsTable();

  const { rows } = await pool.query(`
    SELECT "key", "value"
    FROM "SystemSetting"
  `);

  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

const getSystemSetting = async (key) => {
  await ensureSystemSettingsTable();

  const { rows } = await pool.query(`
    SELECT "value"
    FROM "SystemSetting"
    WHERE "key" = $1
    LIMIT 1
  `, [key]);

  return rows[0]?.value ?? null;
};

const upsertSystemSetting = async (key, value) => {
  await ensureSystemSettingsTable();
  const columns = await getSystemSettingColumns();

  const insertColumns = [];
  const insertValues = [];
  const updateAssignments = [];
  const params = [];
  let paramIndex = 1;

  if (columns.has('id')) {
    insertColumns.push('"id"');
    insertValues.push(`$${paramIndex++}`);
    params.push(randomUUID());
  }

  insertColumns.push('"key"');
  insertValues.push(`$${paramIndex++}`);
  params.push(key);

  insertColumns.push('"value"');
  insertValues.push(`$${paramIndex++}`);
  params.push(value);
  updateAssignments.push(`"value" = EXCLUDED."value"`);

  if (columns.has('updatedAt')) {
    insertColumns.push('"updatedAt"');
    insertValues.push('NOW()');
    updateAssignments.push(`"updatedAt" = NOW()`);
  }

  if (columns.has('createdAt')) {
    insertColumns.push('"createdAt"');
    insertValues.push('NOW()');
  }

  await pool.query(`
    INSERT INTO "SystemSetting" (${insertColumns.join(', ')})
    VALUES (${insertValues.join(', ')})
    ON CONFLICT ("key")
    DO UPDATE SET
      ${updateAssignments.join(', ')}
  `, params);

  const { rows } = await pool.query(`
    SELECT "key", "value"
    FROM "SystemSetting"
    WHERE "key" = $1
    LIMIT 1
  `, [key]);

  return rows[0] || { key, value };
};

const resolveRegistrationRole = async () => {
  const configuredRoleName = await getSystemSetting(SYSTEM_SETTING_KEYS.DEFAULT_REGISTRATION_ROLE);
  const normalizedConfiguredRole = configuredRoleName?.trim().toUpperCase();
  const roleName =
    normalizedConfiguredRole && normalizedConfiguredRole !== 'ADMIN'
      ? normalizedConfiguredRole
      : DEFAULT_PUBLIC_REGISTRATION_ROLE;

  const configuredRole = await prisma.role.findUnique({ where: { name: roleName } });
  if (configuredRole) {
    return configuredRole;
  }

  const fallbackRole = await prisma.role.findUnique({
    where: { name: DEFAULT_PUBLIC_REGISTRATION_ROLE }
  });

  if (fallbackRole) {
    return fallbackRole;
  }

  return prisma.role.findFirst({
    where: { name: { not: 'ADMIN' } },
    orderBy: { name: 'asc' }
  });
};

const parseBooleanSetting = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === 'true') return true;
  if (normalizedValue === 'false') return false;

  return fallback;
};

const parseRegisterMaxPerDay = (value, fallback = DEFAULT_REGISTER_MAX_PER_DAY) => {
  const parsedValue = Number.parseInt(String(value ?? ''), 10);
  if (REGISTER_MAX_PER_DAY_OPTIONS.includes(parsedValue)) {
    return parsedValue;
  }

  return REGISTER_MAX_PER_DAY_OPTIONS.includes(fallback)
    ? fallback
    : DEFAULT_REGISTER_MAX_PER_DAY;
};

const isRegisterPageEnabled = async () => {
  const rawValue = await getSystemSetting(SYSTEM_SETTING_KEYS.REGISTER_PAGE_ENABLED);
  return parseBooleanSetting(rawValue, DEFAULT_REGISTER_PAGE_ENABLED);
};

const getRegisterMaxPerDay = async () => {
  const rawValue = await getSystemSetting(SYSTEM_SETTING_KEYS.REGISTER_MAX_PER_DAY);
  return parseRegisterMaxPerDay(rawValue, DEFAULT_REGISTER_MAX_PER_DAY);
};

const getTimeZoneDateParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number.parseInt(part.value, 10);
    }
    return acc;
  }, {});

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = getTimeZoneDateParts(date, timeZone);
  const zonedTimeAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return zonedTimeAsUtc - date.getTime();
};

const zonedMidnightToUtc = (year, month, day, timeZone) => {
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0);
  let offsetMs = getTimeZoneOffsetMs(new Date(utcMidnight), timeZone);
  let utcDate = new Date(utcMidnight - offsetMs);

  const adjustedOffsetMs = getTimeZoneOffsetMs(utcDate, timeZone);
  if (adjustedOffsetMs !== offsetMs) {
    utcDate = new Date(utcMidnight - adjustedOffsetMs);
  }

  return utcDate;
};

const getRegistrationLimitWindow = (now = new Date(), timeZone = DEFAULT_REGISTRATION_LIMIT_TIME_ZONE) => {
  const parts = getTimeZoneDateParts(now, timeZone);
  const start = zonedMidnightToUtc(parts.year, parts.month, parts.day, timeZone);
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1, 0, 0, 0));
  const nextDayParts = getTimeZoneDateParts(nextDay, 'UTC');
  const end = zonedMidnightToUtc(nextDayParts.year, nextDayParts.month, nextDayParts.day, timeZone);

  return { start, end, timeZone };
};

module.exports = {
  SYSTEM_SETTING_KEYS,
  DEFAULT_PUBLIC_REGISTRATION_ROLE,
  DEFAULT_REGISTER_PAGE_ENABLED,
  REGISTER_MAX_PER_DAY_OPTIONS,
  DEFAULT_REGISTER_MAX_PER_DAY,
  DEFAULT_REGISTRATION_LIMIT_TIME_ZONE,
  DEFAULT_WEBSITE_TITLE,
  DEFAULT_WEBSITE_FAVICON_URL,
  getSystemSettingsMap,
  getSystemSetting,
  upsertSystemSetting,
  resolveRegistrationRole,
  parseBooleanSetting,
  parseRegisterMaxPerDay,
  isRegisterPageEnabled,
  getRegisterMaxPerDay,
  getRegistrationLimitWindow
};
