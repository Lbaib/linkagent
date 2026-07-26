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

export interface AnonymousToken {
  token: string;
  visitorId: string;
}

export const authApi = {
  login: (data: LoginDTO) => {
    return http.post<any, { token: string }>('/api/auth/login', data);
  },
  getUserInfo: () => {
    return http.get<any, UserInfo>('/api/auth/user-info');
  },
  getAnonymousToken: () => {
    return http.get<any, AnonymousToken>('/api/auth/anonymous');
  }
};
