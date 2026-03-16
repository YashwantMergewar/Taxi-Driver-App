import axiosInstance from './axios';

// GET /api/v1/passenger/me  (Passenger only)
export const getMyPassengerProfileApi = async () => {
  const { data } = await axiosInstance.get('/passenger/me');
  return data;
};

// PATCH /api/v1/passenger/update  (Passenger only)
export const updatePassengerProfileApi = async (payload) => {
  const { data } = await axiosInstance.patch('/passenger/update', payload);
  return data;
};

// GET /api/v1/passenger/bookings  (Passenger only)
export const getMyBookingsApi = async () => {
  const { data } = await axiosInstance.get('/passenger/bookings');
  return data;
};

// PATCH /api/v1/passenger/booking/:id/cancel  (Passenger only)
export const cancelBookingApi = async (bookingId) => {
  const { data } = await axiosInstance.patch(`/passenger/booking/${bookingId}/cancel`);
  return data;
};