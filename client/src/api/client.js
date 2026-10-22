import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
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
};

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
