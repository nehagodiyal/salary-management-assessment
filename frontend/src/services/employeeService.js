import httpClient from '@/api/httpClient';
import endpoints from '@/api/endpoints';

const stripEmpty = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );

export const employeeService = {
  async list(params = {}) {
    const { data } = await httpClient.get(endpoints.employees.list, {
      params: stripEmpty(params),
    });
    return data;
  },
  async get(id) {
    const { data } = await httpClient.get(endpoints.employees.detail(id));
    return data;
  },
  async create(payload) {
    const { data } = await httpClient.post(endpoints.employees.list, payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await httpClient.put(endpoints.employees.detail(id), payload);
    return data;
  },
  async remove(id) {
    await httpClient.delete(endpoints.employees.detail(id));
    return id;
  },
};

export default employeeService;
