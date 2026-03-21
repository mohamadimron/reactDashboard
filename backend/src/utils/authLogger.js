const prisma = require('./db');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');

/**
 * Logs an authentication event asynchronously.
 * @param {Object} params - Logging data
 */
const logAuthEvent = async ({
  userId = null,
  usernameInput,
  eventType,
  failureReason = null,
  req
}) => {
  try {
    const rawUA = req.headers['user-agent'] || 'Unknown';
    const parser = new UAParser(rawUA);
    const uaResult = parser.getResult();
    
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const browser = uaResult.browser.name || 'Unknown';
    const os = uaResult.os.name || 'Unknown';
    const deviceType = uaResult.device.type ? uaResult.device.type.charAt(0).toUpperCase() + uaResult.device.type.slice(1) : 'Desktop';
    
    // Generate a simple device ID based on UA and IP (can be more complex in prod)
    const deviceId = crypto.createHash('md5').update(`${rawUA}-${ipAddress}`).digest('hex');

    let isNewDevice = false;
    let isSuspicious = false;

    if (userId && eventType === 'LOGIN_SUCCESS') {
      // Check if this combination of user and device ID has been seen before
      const existingDevice = await prisma.authLog.findFirst({
        where: { userId, deviceId, eventType: 'LOGIN_SUCCESS' }
      });
      isNewDevice = !existingDevice;
    }

    // Suspicious detection: > 5 failures in 5 minutes for this username or IP
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failureCount = await prisma.authLog.count({
      where: {
        OR: [
          { usernameInput: usernameInput },
          { ipAddress: ipAddress }
        ],
        eventType: 'LOGIN_FAILED',
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (failureCount >= 5) {
      isSuspicious = true;
    }

    // Atomic creation
    await prisma.authLog.create({
      data: {
        userId,
        usernameInput,
        eventType,
        failureReason,
        ipAddress,
        userAgent: rawUA,
        deviceType,
        browser,
        os,
        deviceId,
        isNewDevice,
        isSuspicious
      }
    });

  } catch (error) {
    // Non-blocking but logged to console
    console.error('[AuthLogger] Failed to create log:', error.message);
  }
};

module.exports = { logAuthEvent };
