import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 10000,
});

// Friendly error messages mapped to known backend error codes
const ERROR_CODE_MESSAGES = {
  SLOT_ALREADY_BOOKED: 'This slot was just booked by another patient. Please choose another time slot.',
  DOCTOR_UNAVAILABLE: 'The doctor is not available on this day. Please check their working schedule.',
  PAST_DATE: 'Cannot book appointments for past dates. Please pick today or an upcoming date.',
  PAST_TIME: 'This time slot has already passed for today. Please pick a later slot.',
  DOCTOR_INACTIVE: 'This doctor is currently not accepting new appointments.',
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_CHECKED_IN: 'This patient is already checked in.',
  INVALID_TRANSITION: 'This appointment cannot be cancelled in its current state.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down and try again in a few moments.',
  NETWORK_ERROR: 'Unable to connect to the ClinicFlow server. Please ensure the backend is running.',
  UNAUTHORIZED: 'Session expired or invalid credentials. Please log in again.',
  INVALID_CREDENTIALS: 'The email address or password you entered is incorrect.',
  DOCTOR_BUSY: 'Another patient is currently in consultation. Please complete or skip that consultation first.',
  NO_PATIENTS_WAITING: 'There are no waiting patients in queue for this doctor.',
  CANNOT_SKIP: 'Only waiting patients can be skipped.',
  CANNOT_COMPLETE: 'Only in-consultation patients can be marked completed.',
};

// 1. Request interceptor: Attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinicflow_staff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response interceptor: Extract data and handle 401s / friendly errors
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps successful responses in { success: true, data: ..., meta: ... }
    return response.data;
  },
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';
    let code = 'UNKNOWN_ERROR';
    let details = [];

    if (!error.response) {
      friendlyMessage = ERROR_CODE_MESSAGES.NETWORK_ERROR;
      code = 'NETWORK_ERROR';
    } else {
      const { data, status } = error.response;

      // Handle 401 Unauthorized: clear token and notify auth context
      if (status === 401) {
        if (!error.config?.url?.includes('/auth/login')) {
          localStorage.removeItem('clinicflow_staff_token');
          localStorage.removeItem('clinicflow_staff_user');
          window.dispatchEvent(new CustomEvent('clinicflow:unauthorized'));
        }
        code = 'UNAUTHORIZED';
        friendlyMessage = ERROR_CODE_MESSAGES.UNAUTHORIZED;
      }

      if (data && data.error) {
        code = data.error.code || code;
        details = data.error.details || [];
        friendlyMessage =
          ERROR_CODE_MESSAGES[code] ||
          data.error.message ||
          (status === 404 ? 'Resource not found' : friendlyMessage);
      } else if (data && data.message) {
        friendlyMessage = data.message;
      } else if (status === 404) {
        friendlyMessage = 'The requested resource was not found.';
        code = 'NOT_FOUND';
      } else if (status === 429) {
        friendlyMessage = ERROR_CODE_MESSAGES.RATE_LIMIT_EXCEEDED;
        code = 'RATE_LIMIT_EXCEEDED';
      }
    }

    const enhancedError = new Error(friendlyMessage);
    enhancedError.code = code;
    enhancedError.details = details;
    enhancedError.status = error.response?.status;
    enhancedError.raw = error;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
