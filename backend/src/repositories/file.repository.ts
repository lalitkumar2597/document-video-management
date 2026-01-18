import { File, IFile } from '../models/File';
import { Types } from 'mongoose';
import { PaginationOptions, PaginatedResponse } from '../types';

export class FileRepository {
  async create(fileData: Partial<IFile>): Promise<IFile> {
    const file = new File(fileData);
    return await file.save();
  }

  async findById(id: string | Types.ObjectId): Promise<IFile | null> {
    return await File.findById(id).exec();
  }

  async findByFilename(filename: string): Promise<IFile | null> {
    return await File.findOne({ filename }).exec();
  }

  async findByOwner(
    ownerId: string | Types.ObjectId,
    options: PaginationOptions
  ): Promise<PaginatedResponse<IFile>> {
    const { page, limit, sortBy = 'uploadDate', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = { ownerId };
    const [data, total] = await Promise.all([
      File.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      File.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchFiles(
    ownerId: string | Types.ObjectId,
    searchTerm: string,
    options: PaginationOptions
  ): Promise<PaginatedResponse<IFile>> {
    const { page, limit, sortBy = 'uploadDate', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {
      ownerId,
      $or: [
        { originalName: { $regex: searchTerm, $options: 'i' } },
        { filename: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    const [data, total] = await Promise.all([
      File.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      File.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string | Types.ObjectId,
    updateData: Partial<IFile>
  ): Promise<IFile | null> {
    return await File.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async delete(id: string | Types.ObjectId): Promise<IFile | null> {
    return await File.findByIdAndDelete(id).exec();
  }

  async deleteByOwner(
    ownerId: string | Types.ObjectId,
    fileId: string | Types.ObjectId
  ): Promise<IFile | null> {
    return await File.findOneAndDelete({ _id: fileId, ownerId }).exec();
  }

  async getTotalSizeByOwner(ownerId: string | Types.ObjectId): Promise<number> {
    const result = await File.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId.toString()) } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]).exec();

    return result.length > 0 ? result[0].totalSize : 0;
  }

  async getFileCountByOwner(ownerId: string | Types.ObjectId): Promise<number> {
    return await File.countDocuments({ ownerId }).exec();
  }
}