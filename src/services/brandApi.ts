import apiClient from '../lib/axios';

export const brandApi = {
  getConfig: <T = unknown>() =>
    apiClient.get<T>('/brand/config'),
};
