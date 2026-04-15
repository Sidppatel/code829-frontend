import apiClient from '../lib/axios';

export interface SubmitFeedbackRequest {
  name: string;
  email?: string;
  type: string;
  message: string;
  rating: number;
}

export const feedbackApi = {
  submit: (request: SubmitFeedbackRequest) =>
    apiClient.post<{ message: string }>('/feedback', request),
};
