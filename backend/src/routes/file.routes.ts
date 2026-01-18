import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadFileValidation, paginationValidation, searchValidation } from '../middleware/validation.middleware';
import { configs } from '../config/env';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: configs.UPLOAD_LIMIT_MB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    // You can add file type validation here
    cb(null, true);
  },
});

// All routes require authentication
router.use(authenticate);

// File routes
router.post(
  '/upload',
  upload.single('file'),
  uploadFileValidation,
  FileController.upload
);

router.get('/list', paginationValidation, FileController.list);
router.get('/search', searchValidation, FileController.search);
router.get('/stats', FileController.stats);
router.get('/:id', FileController.get);
router.put('/:id', FileController.update);
router.delete('/:id', FileController.delete);

export default router;