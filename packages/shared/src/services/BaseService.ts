import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from '../lib/axios';
import { createLogger } from '../lib/logger';

/**
 * Abstract base for all domain services. Wraps the shared `apiClient` so every
 * subclass inherits auth/portal/retry/logging behaviour configured there.
 *
 * Subclasses call `this.get/post/put/patch/delete` and expose domain methods
 * as arrow-function instance properties so the returned singleton can be
 * destructured without losing `this`. The singleton lives in each subclass
 * via `static getInstance()`.
 */
export abstract class BaseService {
  protected readonly client = apiClient;
  protected readonly log: ReturnType<typeof createLogger>;

  protected constructor(source: string) {
    this.log = createLogger(source);
  }

  // Defaults match axios itself (`get<T = any>`) so callers that don't supply a
  // type argument keep the pre-migration `any`-typed `.data` and existing page
  // code continues to type-check.
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
}
