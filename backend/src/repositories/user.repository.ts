import { User, IUser } from '../models/User';
import { Types } from 'mongoose';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email: string, includePassword: boolean = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password +refreshTokens');
    }
    return await query.exec();
  }

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findById(id).exec();
  }

  async findByIdWithTokens(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findById(id).select('+refreshTokens').exec();
  }

  async update(
    id: string | Types.ObjectId,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async addRefreshToken(userId: string | Types.ObjectId, refreshToken: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $push: { refreshTokens: refreshToken } }
    ).exec();
  }

  async removeRefreshToken(userId: string | Types.ObjectId, refreshToken: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: refreshToken } }
    ).exec();
  }

  async clearAllRefreshTokens(userId: string | Types.ObjectId): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokens: [] } }
    ).exec();
  }

  async updateLastLogin(userId: string | Types.ObjectId): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $set: { lastLogin: new Date() } }
    ).exec();
  }

  async delete(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findByIdAndDelete(id).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() }).exec();
    return count > 0;
  }
}