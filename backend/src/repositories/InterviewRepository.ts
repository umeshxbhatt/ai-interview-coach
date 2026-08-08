import { Interview, IInterview } from '../models/Interview';

export class InterviewRepository {
  async create(interviewData: Partial<IInterview>): Promise<IInterview> {
    return await Interview.create(interviewData);
  }

  async findById(id: string): Promise<IInterview | null> {
    return await Interview.findById(id).exec();
  }

  async findByIdWithUser(id: string): Promise<IInterview | null> {
    return await Interview.findById(id).populate('user').exec();
  }

  async update(id: string, updateData: Partial<IInterview>): Promise<IInterview | null> {
    return await Interview.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async findByUser(userId: string): Promise<IInterview[]> {
    return await Interview.find({ user: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Interview.findByIdAndDelete(id).exec();
    return !!result;
  }
}
