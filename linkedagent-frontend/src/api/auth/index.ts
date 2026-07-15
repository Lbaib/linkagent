import http from '../http';

export interface LoginDTO {
  username: string;
  password?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  roles: string[];
}

export const authApi = {
  login: (data: LoginDTO) => {
    return http.post<any, { token: string }>('/api/auth/login', data);
  },
  getUserInfo: () => {
    return http.get<any, UserInfo>('/api/auth/user-info');
  }
};
