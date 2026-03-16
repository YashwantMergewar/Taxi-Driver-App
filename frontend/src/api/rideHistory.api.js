import axiosInstance from './axios';

// GET /api/v1/ride-history/driver
export const getDriverRideHistoryApi = async () => {
  const { data } = await axiosInstance.get('/ride-history/driver');
  return data;
};

// GET /api/v1/ride-history/passenger
export const getPassengerRideHistoryApi = async () => {
  const { data } = await axiosInstance.get('/ride-history/passenger');
  return data;
};

// GET /api/v1/ride-history/all
export const getAllRideHistoryApi = async () => {
  const { data } = await axiosInstance.get('/ride-history/all');
  return data;
};