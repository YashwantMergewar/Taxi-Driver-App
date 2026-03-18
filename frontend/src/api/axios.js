import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// import { Platform } from 'react-native';
// import Constants from 'expo-constants';

// Determine API host dynamically so the app works on emulator, simulator, or physical device.
// Default to Android emulator loopback. Change to your machine IP for physical devices.
let API_BASE_URL = "http://192.168.31.191:8000/api/v1" || 'http://10.0.2.2:8000/api/v1';

// Log resolved base URL at runtime to help debug Network Error issues
try {
  // eslint-disable-next-line no-console
  console.log('[axios] Resolved API_BASE_URL ->', API_BASE_URL);
} catch (e) {
  // ignore logging failures
}
// try {
//   // If running on Android emulator/emulator, prefer 10.0.2.2
//   if (Platform.OS === 'android') {
//     // If debuggerHost is available (Expo), extract IP so physical device can reach host
//     const dbg = Constants.manifest?.debuggerHost || Constants.expoConfig?.debuggerHost || null;
//     if (dbg) {
//       const host = dbg.split(':')[0];
//       API_BASE_URL = `http://${host}:8000/api/v1`;
//     } else {
//       API_BASE_URL = 'http://10.0.2.2:8000/api/v1';
//     }
//   } else {
//     const dbg = Constants.manifest?.debuggerHost || Constants.expoConfig?.debuggerHost || null;
//     if (dbg) {
//       const host = dbg.split(':')[0];
//       API_BASE_URL = `http://${host}:8000/api/v1`;
//     } else {
//       API_BASE_URL = 'http://localhost:8000/api/v1';
//     }
//   }
// } catch (e) {
//   API_BASE_URL = 'http://localhost:8000/api/v1';
// }

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ensure cookies are sent/received
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // 1. Get token from SecureStore
    const token = await SecureStore.getItemAsync('accessToken');
    
    // 2. Attach to header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Ensure cookies are sent (needed for refresh tokens/web)
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  async (response) => {
    // Centralized Token Storage:
    // If ANY response contains an accessToken, we save it immediately.
    // This makes login/register/refresh flow much cleaner.
    if (response.data?.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    }
    return response;
  },
  async (error) => {
    // Handle global 401 Unauthorized errors
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      // Optional: You could trigger a logout or navigation event here
    }

    // Additional debug logging for network errors
    try {
      // eslint-disable-next-line no-console
      console.log('[axios] response error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        status: error.response?.status,
        data: error.response?.data,
      });
    } catch (e) {
      // ignore
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;