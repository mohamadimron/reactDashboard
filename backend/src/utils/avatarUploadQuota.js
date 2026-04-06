const prisma = require('./db');
const pool = prisma.pool;

const AVATAR_UPLOAD_LIMIT_PER_DAY = 5;
const JAKARTA_UTC_OFFSET_HOURS = 7;

const getJakartaQuotaDate = (date = new Date()) => {
  const shiftedDate = new Date(date.getTime() + (JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000));
  return shiftedDate.toISOString().slice(0, 10);
};

const ensureAvatarUploadQuotaTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AvatarUploadQuota" (
      "userId" TEXT NOT NULL,
      "quotaDate" DATE NOT NULL,
      "uploadCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY ("userId", "quotaDate")
    )
  `);
};

const reserveAvatarUploadSlot = async (userId) => {
  await ensureAvatarUploadQuotaTable();

  const quotaDate = getJakartaQuotaDate();
  const { rows } = await pool.query(`
    INSERT INTO "AvatarUploadQuota" ("userId", "quotaDate", "uploadCount", "createdAt", "updatedAt")
    VALUES ($1, $2::date, 1, NOW(), NOW())
    ON CONFLICT ("userId", "quotaDate")
    DO UPDATE SET
      "uploadCount" = "AvatarUploadQuota"."uploadCount" + 1,
      "updatedAt" = NOW()
    WHERE "AvatarUploadQuota"."uploadCount" < $3
    RETURNING "uploadCount"
  `, [userId, quotaDate, AVATAR_UPLOAD_LIMIT_PER_DAY]);

  if (rows.length === 0) {
    return {
      granted: false,
      limit: AVATAR_UPLOAD_LIMIT_PER_DAY,
      remaining: 0
    };
  }

  const uploadCount = Number(rows[0].uploadCount) || 0;
  return {
    granted: true,
    limit: AVATAR_UPLOAD_LIMIT_PER_DAY,
    remaining: Math.max(AVATAR_UPLOAD_LIMIT_PER_DAY - uploadCount, 0)
  };
};

const releaseAvatarUploadSlot = async (userId) => {
  await ensureAvatarUploadQuotaTable();

  const quotaDate = getJakartaQuotaDate();
  const { rows } = await pool.query(`
    UPDATE "AvatarUploadQuota"
    SET
      "uploadCount" = GREATEST("uploadCount" - 1, 0),
      "updatedAt" = NOW()
    WHERE "userId" = $1
      AND "quotaDate" = $2::date
    RETURNING "uploadCount"
  `, [userId, quotaDate]);

  const remainingCount = Number(rows[0]?.uploadCount ?? 0);
  if (rows.length > 0 && remainingCount === 0) {
    await pool.query(`
      DELETE FROM "AvatarUploadQuota"
      WHERE "userId" = $1
        AND "quotaDate" = $2::date
        AND "uploadCount" = 0
    `, [userId, quotaDate]);
  }
};

module.exports = {
  AVATAR_UPLOAD_LIMIT_PER_DAY,
  reserveAvatarUploadSlot,
  releaseAvatarUploadSlot
};
