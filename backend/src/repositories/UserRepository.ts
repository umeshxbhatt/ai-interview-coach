import { User, IUser } from '../models/User';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return await User.create(userData);
  }

  async findByEmail(email: string, selectPassword = false): Promise<IUser | null> {
    const query = User.findOne({ email });
    if (selectPassword) {
      query.select('+password');
    }
    return await query.exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id).exec();
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+password +passwordResetToken +passwordResetExpires')
      .exec();
  }
}
