import { apiRequest } from './http.js'

export const reportsApi = {
  async create(input) {
    return (await apiRequest('/reports', {
      method: 'POST',
      body: input,
      auth: 'required',
    })).data
  },
}
