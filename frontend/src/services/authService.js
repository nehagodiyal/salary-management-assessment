import httpClient from '@/api/httpClient';
import endpoints from '@/api/endpoints';

export const authService = {
  async login({ email, password }) {
    const { data } = await httpClient.post(endpoints.auth.login, { email, password });
    return data;
  },
  async refresh(refreshToken) {
    const { data } = await httpClient.post(endpoints.auth.refresh, {
      refresh_token: refreshToken,
    });
    return data;
  },
  async me() {
    const { data } = await httpClient.get(endpoints.auth.me);
    return data;
  },
  async register({ email, password, role = 'user' }) {
    const { data } = await httpClient.post(endpoints.auth.register, {
      email,
      password,
      role,
    });
    return data;
  },
};

export default authService;
