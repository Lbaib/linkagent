import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { BaseResponse } from './types';

const http: AxiosInstance = axios.create({
  timeout: 10000, // 10秒超时
});

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => {
    const res = response.data;
    // 假设后端 code 为 200 代表成功
    if (res.code === 200) {
      // 剥离外壳，直接返回 data
      return res.data as any; 
    }
    // 业务错误提示
    console.error(`业务错误: ${res.message}`);
    return Promise.reject(new Error(res.message || 'Error'));
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // 清除过期 Token 并跳转登录
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else {
        console.error(`HTTP错误: ${status}`);
      }
    } else {
      console.error('网络请求失败');
    }
    return Promise.reject(error);
  }
);

export default http;
