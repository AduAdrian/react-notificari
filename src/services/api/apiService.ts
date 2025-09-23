/**
 * API Service with comprehensive error handling and security features
 * Implements OWASP guidelines for secure API communication
 */

import { APP_CONSTANTS, API_ENDPOINTS, MESSAGES, SECURITY_CONSTANTS } from '../../utils/constants';
import { retryWithBackoff, checkRateLimit } from '../../utils/helpers';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface ApiError extends Error {
  statusCode?: number;
  response?: any;
}

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    this.baseURL = APP_CONSTANTS.API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    this.abortControllers = new Map();
  }

  /**
   * Generat un request ID unic pentru tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Adaugă headers de securitate
   */
  private getSecureHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers = {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };

    // Add CSRF token if available
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers[SECURITY_CONSTANTS.CSRF_HEADER] = csrfToken;
    }

    return headers;
  }

  /**
   * Obține CSRF token din meta tag sau cookie
   */
  private getCSRFToken(): string | null {
    // Try to get from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;

    // Try to get from cookie
    const cookieMatch = document.cookie.match(/csrf-token=([^;]+)/);
    return cookieMatch ? cookieMatch[1] : null;
  }

  /**
   * Validează răspunsul API
   */
  private validateResponse(response: Response): void {
    // Check for rate limiting
    if (response.status === 429) {
      throw new Error('Prea multe cereri. Încercați din nou mai târziu.');
    }

    // Check for authentication issues
    if (response.status === 401) {
      // Clear any stored auth data
      this.handleAuthError();
      throw new Error(MESSAGES.AUTH.TOKEN_EXPIRED);
    }

    // Check for authorization issues
    if (response.status === 403) {
      throw new Error(MESSAGES.AUTH.ACCESS_DENIED);
    }

    // Check for not found
    if (response.status === 404) {
      throw new Error(MESSAGES.ERRORS.NOT_FOUND);
    }

    // Check for server errors
    if (response.status >= 500) {
      throw new Error(MESSAGES.ERRORS.SERVER_ERROR);
    }
  }

  /**
   * Gestionează erorile de autentificare
   */
  private handleAuthError(): void {
    // Emit custom event for auth error
    window.dispatchEvent(new CustomEvent('auth:error'));
    
    // Clear any stored tokens (if using localStorage/sessionStorage)
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  }

  /**
   * Procesează răspunsul API
   */
  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    this.validateResponse(response);

    let data: any;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      throw new Error('Răspuns invalid de la server');
    }

    // Validate response structure
    if (typeof data === 'object' && data !== null) {
      return {
        success: response.ok,
        data: data.data || data,
        message: data.message,
        error: data.error,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: response.ok,
      data: data as T,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execută o cerere HTTP cu retry logic și security features
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    retries: number = 2
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      // Rate limiting check
      const rateLimitKey = `api_${endpoint.split('?')[0]}`;
      if (!checkRateLimit(rateLimitKey)) {
        throw new Error('Prea multe cereri pentru acest endpoint. Încercați din nou mai târziu.');
      }

      const requestOptions: RequestInit = {
        ...options,
        headers: this.getSecureHeaders(options.headers as Record<string, string>),
        credentials: 'include', // Include cookies for session-based auth
        signal: controller.signal,
      };

      // Add timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, APP_CONSTANTS.DEFAULT_TIMEOUT);

      const response = await retryWithBackoff(
        async () => {
          const res = await fetch(`${this.baseURL}${endpoint}`, requestOptions);
          clearTimeout(timeoutId);
          return res;
        },
        retries,
        1000
      );

      return await this.processResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Cererea a fost anulată');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error(MESSAGES.ERRORS.NETWORK_ERROR);
        }
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.executeRequest<T>(url, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file cu progress tracking
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Add CSRF token
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        formData.append('_token', csrfToken);
      }

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: xhr.status < 400,
            data: response,
            statusCode: xhr.status,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          reject(new Error('Eroare la procesarea răspunsului'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(MESSAGES.ERRORS.NETWORK_ERROR));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Anulează toate cererile în așteptare
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Verifică conectivitatea la API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get(API_ENDPOINTS.HEALTH);
      return response.success;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export specific API methods for different modules
export const authAPI = {
  login: (credentials: any) => apiService.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (data: any) => apiService.post(API_ENDPOINTS.AUTH.REGISTER, data),
  logout: () => apiService.post(API_ENDPOINTS.AUTH.LOGOUT),
  checkSession: () => apiService.get(API_ENDPOINTS.AUTH.SESSION),
  verify: (data: any) => apiService.post(API_ENDPOINTS.AUTH.VERIFY, data),
};

export const adminAPI = {
  getClients: (params?: any) => apiService.get(API_ENDPOINTS.ADMIN.CLIENTS, params),
  getCPanel: () => apiService.get(API_ENDPOINTS.ADMIN.CPANEL),
  manageUsers: (data: any) => apiService.post(API_ENDPOINTS.ADMIN.MANAGE_USERS, data),
};

export const clientAPI = {
  getSchedule: (userId?: string) => apiService.get(`${API_ENDPOINTS.CLIENT.SCHEDULE}${userId ? `/${userId}` : ''}`),
  createSchedule: (data: any) => apiService.post(API_ENDPOINTS.CLIENT.SCHEDULE, data),
  updateSchedule: (id: string, data: any) => apiService.put(`${API_ENDPOINTS.CLIENT.SCHEDULE}/${id}`, data),
  deleteSchedule: (id: string) => apiService.delete(`${API_ENDPOINTS.CLIENT.SCHEDULE}/${id}`),
};

export const notificationAPI = {
  checkExpiring: (days?: number) => apiService.get(API_ENDPOINTS.NOTIFICATIONS.CHECK, { days }),
  sendNotifications: (data: any) => apiService.post(API_ENDPOINTS.NOTIFICATIONS.SEND, data),
};