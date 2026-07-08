const multer = require('multer');
const path = require('path');
const config = require('../config/env');

/**
 * Multer configuration for file uploads.
 * Supports ZIP files up to 50MB.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/octet-stream',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  const allowedExts = ['.zip', '.pdf', '.doc', '.docx', '.ppt', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP, PDF, DOC, or PPT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 50MB default
  },
});

module.exports = upload;
