import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from '../lib/axios';
import { createLogger } from '../lib/logger';

export abstract class BaseService {
  protected readonly client = apiClient;
  protected readonly log: ReturnType<typeof createLogger>;

  protected constructor(source: string) {
    this.log = createLogger(source);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  protected get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  protected post<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  protected put<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  protected patch<T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  protected delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
