import axiosInstance from './axios';

// POST /api/v1/bookings/create  (Passenger only)
export const createBookingApi = async (payload) => {
  const { data } = await axiosInstance.post('/bookings/create', payload);
  return data;
};

// PATCH /api/v1/bookings/:id/accept  (Driver only)
export const acceptBookingApi = async (bookingId) => {
  const { data } = await axiosInstance.patch(`/bookings/${bookingId}/accept`);
  return data;
};

// PATCH /api/v1/bookings/:id/reject  (Driver only)
export const rejectBookingApi = async (bookingId) => {
  const { data } = await axiosInstance.patch(`/bookings/${bookingId}/reject`);
  return data;
};

// PATCH /api/v1/bookings/:id/complete  (Driver only)
export const completeTripApi = async (bookingId) => {
  const { data } = await axiosInstance.patch(`/bookings/${bookingId}/complete`);
  return data;
};