import axiosInstance from './axios';

// GET /api/v1/driver/me  (Driver only)
export const getMyDriverProfileApi = async () => {
  const { data } = await axiosInstance.get('/driver/me');
  return data;
};

// PATCH /api/v1/driver/status  (Driver only)
export const updateDriverStatusApi = async (status) => {
  const { data } = await axiosInstance.patch('/driver/status', { status });
  return data;
};

// POST /api/v1/driver/queue/join  (Driver only)
export const joinQueueApi = async () => {
  const { data } = await axiosInstance.post('/driver/queue/join');
  return data;
};

// POST /api/v1/driver/queue/leave  (Driver only)
export const leaveQueueApi = async () => {
  const { data } = await axiosInstance.post('/driver/queue/leave');
  return data;
};

// GET /api/v1/driver/available  (Driver only)
export const getAvailableDriversApi = async () => {
  const { data } = await axiosInstance.get('/driver/available');
  return data;
};