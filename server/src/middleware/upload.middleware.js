import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from '../config/index.js';

const tempUploadDir = path.join(os.tmpdir(), 'bribeshield-temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.storage.allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not supported. Permitted types: Images, PDF, MP4 Video, Audio recordings.`));
  }
};

export const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxFileSize, // 10MB
    files: 5 // Max 5 evidence files per submission
  }
});

