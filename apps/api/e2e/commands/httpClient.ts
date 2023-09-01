import axios from 'axios';

const baseURL = `http://localhost:${process.env.HTTP_PORT_NUMBER}`;

export const client = axios.create({
  baseURL,
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});
