import axiosInstance from './axios.js';

export const loginApi = async (userData) => {
  // console.log('Attempting to log in with user data:', userData)
  const { data } = await axiosInstance.post('/users/login-user', userData, { withCredentials: true });
  
  // console.log('Login response data:', data);
  return data;
};

export const getCurrentUserApi = async () => {
  const { data } = await axiosInstance.get('/users/me');
  return data;
};

export const registerApi = async (userData) => {
  const { data } = await axiosInstance.post('/users/register-user', userData, { withCredentials: true });
  // console.log(data);
  return data;
};

export const logoutApi = async () => {
  const { data } = await axiosInstance.post('/users/logout-user', {}, { withCredentials: true });
  return data;
};
