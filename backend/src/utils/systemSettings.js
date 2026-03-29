const prisma = require('./db');
const pool = prisma.pool;
const { randomUUID } = require('crypto');

const SYSTEM_SETTING_KEYS = {
  DEFAULT_REGISTRATION_ROLE: 'defaultRegistrationRole',
  REGISTER_PAGE_ENABLED: 'registerPageEnabled'
};

const DEFAULT_PUBLIC_REGISTRATION_ROLE = 'USER';
const DEFAULT_REGISTER_PAGE_ENABLED = true;

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

const resolveRegistrationRole = async ({ userCount }) => {
  if (userCount === 0) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    return adminRole;
  }

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

const isRegisterPageEnabled = async () => {
  const rawValue = await getSystemSetting(SYSTEM_SETTING_KEYS.REGISTER_PAGE_ENABLED);
  return parseBooleanSetting(rawValue, DEFAULT_REGISTER_PAGE_ENABLED);
};

module.exports = {
  SYSTEM_SETTING_KEYS,
  DEFAULT_PUBLIC_REGISTRATION_ROLE,
  DEFAULT_REGISTER_PAGE_ENABLED,
  getSystemSettingsMap,
  getSystemSetting,
  upsertSystemSetting,
  resolveRegistrationRole,
  parseBooleanSetting,
  isRegisterPageEnabled
};
