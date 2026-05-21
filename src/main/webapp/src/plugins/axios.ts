import axios, { type AxiosError, type AxiosResponse } from 'axios';

const TIMEOUT = 60000;

const axiosInstance = axios.create({
  timeout: TIMEOUT,
  baseURL: '',
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
