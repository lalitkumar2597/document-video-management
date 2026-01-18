import { Router } from 'express';
import { StreamController } from '../controllers/stream.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Stream routes
router.get('/file/:id', StreamController.streamFile);
router.get('/file/:id/info', StreamController.getFileInfo);
router.get('/file/:id/download', StreamController.downloadFile);
router.get('/video/:id/thumbnail', StreamController.getVideoThumbnail);

export default router;