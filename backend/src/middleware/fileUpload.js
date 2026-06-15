import multer from 'multer';
import path from 'path';

// Configure file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'));
  }
};

// Expose multer upload middleware using memory storage
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
  fileFilter: fileFilter
});

export const upload = {
  single: (fieldName) => {
    return (req, res, next) => {
      uploadMemory.single(fieldName)(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          // Generate unique filename to match the previous disk storage behavior
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(req.file.originalname);
          req.file.filename = `proof-${uniqueSuffix}${ext}`;
        }
        next();
      });
    };
  }
};

