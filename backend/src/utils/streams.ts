import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { VideoStreamRange } from '../types';

export class StreamUtils {
  static parseRangeHeader(rangeHeader: string, fileSize: number): VideoStreamRange | null {
    if (!rangeHeader) return null;

    const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!matches) return null;

    const start = parseInt(matches[1], 10);
    const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return null;
    }

    return {
      start,
      end,
      size: fileSize,
    };
  }

  static createStreamHeaders(range: VideoStreamRange, contentType: string) {
    const contentLength = range.end - range.start + 1;
    
    return {
      'Content-Range': `bytes ${range.start}-${range.end}/${range.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': contentType,
    };
  }

  static streamFile(filePath: string, range: VideoStreamRange, res: Response): void {
    const stream = fs.createReadStream(filePath, {
      start: range.start,
      end: range.end,
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Error streaming file' });
    });

    stream.pipe(res);
  }

  static async getFileSize(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) reject(err);
        else resolve(stats.size);
      });
    });
  }

  static async fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }
}