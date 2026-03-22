const prisma = require('./db');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Logs an authentication event asynchronously.
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
    
    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim(); // Handle multiple IPs in proxy
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') ipAddress = 'Localhost';

    const browser = uaResult.browser.name || 'Unknown';
    const os = uaResult.os.name || 'Unknown';
    const deviceType = uaResult.device.type ? uaResult.device.type.charAt(0).toUpperCase() + uaResult.device.type.slice(1) : 'Desktop';
    
    const deviceId = crypto.createHash('md5').update(`${rawUA}-${ipAddress}`).digest('hex');

    // Fetch Geo & ISP Info
    let isp = 'Internal Network';
    let country = 'Local';
    
    if (ipAddress !== 'Localhost') {
      try {
        // Requesting country name along with ISP
        const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,country,isp`);
        if (response.data && response.data.status === 'success') {
          isp = response.data.isp;
          country = response.data.country;
        }
      } catch (ispErr) {
        console.warn(`[AuthLogger] Geo lookup failed for ${ipAddress}:`, ispErr.message);
      }
    }

    let isNewDevice = false;
    if (userId && eventType === 'LOGIN_SUCCESS') {
      const existingDevice = await prisma.authLog.findFirst({
        where: { userId, deviceId, eventType: 'LOGIN_SUCCESS' }
      });
      isNewDevice = !existingDevice;
    }

    // Suspicious detection
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failureCount = await prisma.authLog.count({
      where: {
        OR: [{ usernameInput }, { ipAddress }],
        eventType: 'LOGIN_FAILED',
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    const isSuspicious = failureCount >= 5;

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
        isp,
        country,
        isNewDevice,
        isSuspicious
      }
    });

  } catch (error) {
    console.error('[AuthLogger] Critical logging failure:', error.stack);
  }
};

module.exports = { logAuthEvent };
