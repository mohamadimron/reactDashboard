const multer = require('multer');

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/webp',
  'image/svg+xml'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const mimeType = (file.mimetype || '').toLowerCase();
    if (allowedMimeTypes.has(mimeType)) {
      return cb(null, true);
    }

    return cb(new Error('Invalid image type. Only PNG, JPEG, WEBP, and SVG are allowed.'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;
