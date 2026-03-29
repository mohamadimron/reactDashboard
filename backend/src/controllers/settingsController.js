const prisma = require('../utils/db');
const {
  SYSTEM_SETTING_KEYS,
  DEFAULT_PUBLIC_REGISTRATION_ROLE,
  DEFAULT_REGISTER_PAGE_ENABLED,
  getSystemSettingsMap,
  parseBooleanSetting,
  upsertSystemSetting
} = require('../utils/systemSettings');

// Get all system settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = await getSystemSettingsMap();
    res.json({
      defaultRegistrationRole:
        settings[SYSTEM_SETTING_KEYS.DEFAULT_REGISTRATION_ROLE] || DEFAULT_PUBLIC_REGISTRATION_ROLE,
      registerPageEnabled: parseBooleanSetting(
        settings[SYSTEM_SETTING_KEYS.REGISTER_PAGE_ENABLED],
        DEFAULT_REGISTER_PAGE_ENABLED
      )
    });
  } catch (error) {
    console.error('[Settings] Fetch Error:', error);
    res.status(500).json({ message: 'Error fetching system settings' });
  }
};

const getPublicSystemSettings = async (req, res) => {
  try {
    const settings = await getSystemSettingsMap();
    res.json({
      registerPageEnabled: parseBooleanSetting(
        settings[SYSTEM_SETTING_KEYS.REGISTER_PAGE_ENABLED],
        DEFAULT_REGISTER_PAGE_ENABLED
      )
    });
  } catch (error) {
    console.error('[Settings] Public Fetch Error:', error);
    res.status(500).json({ message: 'Error fetching public system settings' });
  }
};

// Update a specific setting
const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'Key is required' });

    if (key === SYSTEM_SETTING_KEYS.DEFAULT_REGISTRATION_ROLE) {
      const normalizedRoleName = String(value || '').trim().toUpperCase();

      if (!normalizedRoleName) {
        return res.status(400).json({ message: 'Default registration role is required' });
      }

      if (normalizedRoleName === 'ADMIN') {
        return res.status(400).json({
          message: 'ADMIN cannot be used as the default public registration role'
        });
      }

      const role = await prisma.role.findUnique({ where: { name: normalizedRoleName } });
      if (!role) {
        return res.status(400).json({ message: 'Selected role does not exist' });
      }

      const setting = await upsertSystemSetting(key, normalizedRoleName);
      return res.json(setting);
    }

    if (key === SYSTEM_SETTING_KEYS.REGISTER_PAGE_ENABLED) {
      const normalizedValue = parseBooleanSetting(value, DEFAULT_REGISTER_PAGE_ENABLED);
      const setting = await upsertSystemSetting(key, normalizedValue ? 'true' : 'false');
      return res.json(setting);
    }

    const setting = await upsertSystemSetting(key, String(value ?? ''));
    res.json(setting);
  } catch (error) {
    console.error('[Settings] Update Error:', error);
    res.status(500).json({ message: 'Error updating setting' });
  }
};

module.exports = { getSystemSettings, getPublicSystemSettings, updateSetting };
