import mongoose, { Schema, Document, Types } from 'mongoose';
import { FileMetadata } from '../types';

export interface IFile extends Document, Omit<FileMetadata, 'ownerId'> {
  ownerId: Types.ObjectId;
}

const FileSchema: Schema = new Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      unique: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: function (this: IFile) {
        return this.isVideo;
      },
      min: [0, 'Duration cannot be negative'],
    },
    thumbnailPath: {
      type: String,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
FileSchema.index({ ownerId: 1, filename: 1 });
FileSchema.index({ ownerId: 1, uploadDate: -1 });
FileSchema.index({ isVideo: 1 });
FileSchema.index({ mimeType: 1 });
FileSchema.index({ 'originalName': 'text', 'filename': 'text' });

export const File = mongoose.model<IFile>('File', FileSchema);