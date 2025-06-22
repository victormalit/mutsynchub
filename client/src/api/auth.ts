import axios from 'axios';

export const login = async (email: string, password: string) => {
  return axios.post('/api/auth/login', { email, password });
};

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  subdomain: string;
}) => {
  return axios.post('/api/auth/register', data);
};
