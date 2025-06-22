import axios from 'axios';

// --- Analytics API Layer ---

export const getSchedules = (orgId: string, token: string) =>
  axios.get(`/api/analytics/schedule/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createSchedule = (data: any, token: string) =>
  axios.post('/api/analytics/schedule', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateSchedule = (id: string, data: any, token: string) =>
  axios.put(`/api/analytics/schedule/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteSchedule = (id: string, token: string) =>
  axios.delete(`/api/analytics/schedule/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const runQuery = (queryDto: any, token: string) =>
  axios.post('/api/analytics/query', queryDto, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getQueryHistory = (orgId: string, token: string) =>
  axios.get(`/api/analytics/query/history/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
