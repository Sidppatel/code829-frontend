import { BaseService } from './BaseService';

export interface SubmitFeedbackRequest {
  name: string;
  email?: string;
  type: string;
  message: string;
  rating: number;
}

export class FeedbackService extends BaseService {
  private static _instance: FeedbackService | null = null;
  static getInstance(): FeedbackService {
    return (this._instance ??= new FeedbackService());
  }
  private constructor() {
    super('FeedbackService');
  }

  submit = (request: SubmitFeedbackRequest) =>
    this.post<{ message: string }>('/feedback', request);
}

export const feedbackService = FeedbackService.getInstance();
