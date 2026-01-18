import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { FileRepository } from '../repositories/file.repository';
import { redisService } from './redis.service';
import { IFile } from '../models/File';
import { PaginationOptions, PaginatedResponse } from '../types';
import { configs } from '../config/env';

export class FileService {
  private fileRepository: FileRepository;
  private uploadDir: string;

  constructor() {
    this.fileRepository = new FileRepository();
    this.uploadDir = path.resolve(__dirname, '../../uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    ownerId: any,
    metadata?: { duration?: number; thumbnailPath?: string }
  ): Promise<IFile> {
    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    // Move file to upload directory
    await fs.promises.writeFile(filePath, file.buffer);

    // Determine if file is video
    const isVideo = file.mimetype.startsWith('video/');

    // Create file record
    const fileData: Partial<IFile> = {
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      ownerId,
      path: filePath,
      isVideo,
      uploadDate: new Date(),
      ...metadata,
    };

    const savedFile = await this.fileRepository.create(fileData);

    // Cache file metadata
    await redisService.cacheFileMetadata(savedFile._id.toString(), savedFile);

    return savedFile;
  }

  async getFileById(fileId: string, ownerId?: any): Promise<IFile | null> {
    // Try to get from cache first
    const cachedMetadata = await redisService.getCachedFileMetadata(fileId);
    if (cachedMetadata) {
      return cachedMetadata;
    }

    // Get from database
    let file: IFile | null;
    if (ownerId) {
      // Only get file if owner matches
      file = await this.fileRepository.findById(fileId);
      if (file && file.ownerId.toString() !== ownerId.toString()) {
        return null;
      }
    } else {
      file = await this.fileRepository.findById(fileId);
    }

    // Cache if found
    if (file) {
      await redisService.cacheFileMetadata(fileId, file);
    }

    return file;
  }

  async getUserFiles(
    ownerId: any,
    options: PaginationOptions
  ): Promise<PaginatedResponse<IFile>> {
    const { page } = options;
    
    // Try to get from cache
    const cachedFiles = await redisService.getCachedUserFiles(ownerId.toString(), page);
    if (cachedFiles) {
      const total = await this.fileRepository.getFileCountByOwner(ownerId);
      return {
        data: cachedFiles,
        total,
        page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    }

    // Get from database
    const result = await this.fileRepository.findByOwner(ownerId, options);

    // Cache the result
    await redisService.cacheUserFiles(ownerId.toString(), page, result.data);

    return result;
  }

  async searchFiles(
    ownerId: any,
    searchTerm: string,
    options: PaginationOptions
  ): Promise<PaginatedResponse<IFile>> {
    // Try to get from cache
    const cachedResults = await redisService.getCachedSearchResults(
      ownerId.toString(),
      searchTerm
    );
    
    if (cachedResults) {
      const total = cachedResults.length;
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedData = cachedResults.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    }

    // Search in database
    const result = await this.fileRepository.searchFiles(ownerId, searchTerm, options);

    // Cache all search results (not just paginated)
    if (result.data.length > 0) {
      await redisService.cacheSearchResults(ownerId.toString(), searchTerm, result.data);
    }

    return result;
  }

  async deleteFile(fileId: string, ownerId: any): Promise<boolean> {
    // Get file first
    const file = await this.fileRepository.findById(fileId);
    if (!file || file.ownerId.toString() !== ownerId.toString()) {
      return false;
    }

    // Delete physical file
    try {
      await fs.promises.unlink(file.path);
      
      // Delete thumbnail if exists
      if (file.thumbnailPath) {
        await fs.promises.unlink(file.thumbnailPath).catch(() => {
          // Ignore thumbnail deletion errors
        });
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    // Delete from database
    const deleted = await this.fileRepository.deleteByOwner(ownerId, fileId);
    if (!deleted) {
      return false;
    }

    // Invalidate cache
    await redisService.invalidateFileMetadata(fileId);
    await redisService.invalidateUserFilesCache(ownerId.toString());

    return true;
  }

  async updateFileMetadata(
    fileId: string,
    ownerId: any,
    updates: Partial<IFile>
  ): Promise<IFile | null> {
    // Verify ownership
    const file = await this.fileRepository.findById(fileId);
    if (!file || file.ownerId.toString() !== ownerId.toString()) {
      return null;
    }

    // Update in database
    const updatedFile = await this.fileRepository.update(fileId, updates);
    if (!updatedFile) {
      return null;
    }

    // Update cache
    await redisService.cacheFileMetadata(fileId, updatedFile);
    await redisService.invalidateUserFilesCache(ownerId.toString());

    return updatedFile;
  }

  async getUserStorageStats(ownerId: any): Promise<{
    totalFiles: number;
    totalSize: number;
    usedPercentage: number;
  }> {
    const [totalFiles, totalSize] = await Promise.all([
      this.fileRepository.getFileCountByOwner(ownerId),
      this.fileRepository.getTotalSizeByOwner(ownerId),
    ]);

    const maxStorage = configs.UPLOAD_LIMIT_MB * 1024 * 1024; // Convert MB to bytes
    const usedPercentage = (totalSize / maxStorage) * 100;

    return {
      totalFiles,
      totalSize,
      usedPercentage: Math.min(100, usedPercentage),
    };
  }

  async fileExists(fileId: string, ownerId?: any): Promise<boolean> {
    const file = await this.getFileById(fileId, ownerId);
    return !!file;
  }

  async getFilePath(fileId: string, ownerId?: any): Promise<string | null> {
    const file = await this.getFileById(fileId, ownerId);
    return file ? file.path : null;
  }
}

export const fileService = new FileService();