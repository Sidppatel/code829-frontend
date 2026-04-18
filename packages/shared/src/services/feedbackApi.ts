import { feedbackService } from './FeedbackService';

export type { SubmitFeedbackRequest } from './FeedbackService';

export const feedbackApi = {
  submit: feedbackService.submit,
};
