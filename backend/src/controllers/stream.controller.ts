import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import { fileService } from '../services/file.service';
import { StreamUtils } from '../utils/streams';
import { asyncHandler } from '../middleware/error.middleware';

export class StreamController {
  static streamFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const file = await fileService.getFileById(id, req.user.userId);

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check if file exists physically
    const fileExists = await StreamUtils.fileExists(file.path);
    if (!fileExists) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    // Get file size
    const fileSize = await StreamUtils.getFileSize(file.path);

    // Parse Range header
    const rangeHeader = req.headers.range;
    if (!rangeHeader) {
      // Send entire file
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = fs.createReadStream(file.path);
      stream.pipe(res);
      return;
    }

    // Parse range
    const range = StreamUtils.parseRangeHeader(rangeHeader, fileSize);
    if (!range) {
      res.status(416).json({ error: 'Requested range not satisfiable' });
      return;
    }

    // Set headers for partial content
    const headers = StreamUtils.createStreamHeaders(range, file.mimeType);
    res.writeHead(206, headers);

    // Stream the file chunk
    StreamUtils.streamFile(file.path, range, res);
  });

  static getFileInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const file = await fileService.getFileById(id, req.user.userId);

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check if file exists physically
    const fileExists = await StreamUtils.fileExists(file.path);
    if (!fileExists) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    // Get file size
    const fileSize = await StreamUtils.getFileSize(file.path);

    res.status(200).json({
      success: true,
      data: {
        ...file.toObject(),
        size: fileSize,
        supportsRange: true,
      },
    });
  });

  static downloadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const file = await fileService.getFileById(id, req.user.userId);

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Check if file exists physically
    const fileExists = await StreamUtils.fileExists(file.path);
    if (!fileExists) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    // Set download headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);

    // Stream the file
    const stream = fs.createReadStream(file.path);
    stream.pipe(res);
  });

  static getVideoThumbnail = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const file = await fileService.getFileById(id, req.user.userId);

    if (!file || !file.isVideo) {
      res.status(404).json({ error: 'Video file not found' });
      return;
    }

    if (!file.thumbnailPath) {
      res.status(404).json({ error: 'Thumbnail not available' });
      return;
    }

    // Check if thumbnail exists
    const thumbnailExists = await StreamUtils.fileExists(file.thumbnailPath);
    if (!thumbnailExists) {
      res.status(404).json({ error: 'Thumbnail not found on disk' });
      return;
    }

    // Send thumbnail
    res.sendFile(path.resolve(file.thumbnailPath));
  });
}