import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { fileService } from '../services/file.service';
import { asyncHandler } from '../middleware/error.middleware';

export class FileController {
  static upload = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const file = await fileService.uploadFile(req.file, req.user.userId, req.body.metadata);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { file },
    });
  });

  static list = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'uploadDate';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const result = await fileService.getUserFiles(req.user.userId, {
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  static get = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const file = await fileService.getFileById(id, req.user.userId);

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { file },
    });
  });

  static search = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { searchTerm } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'uploadDate';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    if (!searchTerm || typeof searchTerm !== 'string') {
      res.status(400).json({ success: false, message: 'Search term is required' });
      return;
    }

    const result = await fileService.searchFiles(req.user.userId, searchTerm, {
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  static delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const deleted = await fileService.deleteFile(id, req.user.userId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'File not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedFile = await fileService.updateFileMetadata(
      id,
      req.user.userId,
      updates
    );

    if (!updatedFile) {
      res.status(404).json({ success: false, message: 'File not found or access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'File updated successfully',
      data: { file: updatedFile },
    });
  });

  static stats = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const stats = await fileService.getUserStorageStats(req.user.userId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  });
}