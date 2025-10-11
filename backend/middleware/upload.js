import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadFolder = '/tmp/uploads';  // Use writable /tmp directory

// Create uploads folder if it doesn't exist (recursive for safety)
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

export default upload;
