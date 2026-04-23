const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const {
  SYSTEM_SETTING_KEYS,
  DEFAULT_WEBSITE_FAVICON_URL
} = require('../utils/systemSettings');
const { getSystemSetting, upsertSystemSetting } = require('../utils/systemSettings');

const UI_ASSETS_DIR = path.join(process.cwd(), 'ui-assets');

const ensureUiAssetsDir = async () => {
  await fs.promises.mkdir(UI_ASSETS_DIR, { recursive: true });
};

const removePreviousFavicon = async (faviconUrl) => {
  if (!faviconUrl || faviconUrl === DEFAULT_WEBSITE_FAVICON_URL) {
    return;
  }

  if (!faviconUrl.startsWith('/ui-assets/')) {
    return;
  }

  const filename = path.basename(faviconUrl);
  const targetPath = path.join(UI_ASSETS_DIR, filename);

  try {
    await fs.promises.unlink(targetPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const uploadFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Favicon image is required' });
    }

    await ensureUiAssetsDir();

    const previousFaviconUrl = await getSystemSetting(SYSTEM_SETTING_KEYS.WEBSITE_FAVICON_URL);
    const filename = `favicon-${Date.now()}.png`;
    const targetPath = path.join(UI_ASSETS_DIR, filename);
    const dbFaviconUrl = `/ui-assets/${filename}`;

    await sharp(req.file.buffer, { density: 512 })
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: false
      })
      .png()
      .toFile(targetPath);

    await upsertSystemSetting(SYSTEM_SETTING_KEYS.WEBSITE_FAVICON_URL, dbFaviconUrl);
    await removePreviousFavicon(previousFaviconUrl);

    res.json({
      key: SYSTEM_SETTING_KEYS.WEBSITE_FAVICON_URL,
      value: dbFaviconUrl
    });
  } catch (error) {
    console.error('[UI Settings] Favicon Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload favicon' });
  }
};

module.exports = {
  uploadFavicon
};
