import axios from 'axios';

export const appClient = axios.create({
   baseURL: import.meta.env.VITE_APP_URL,
   withCredentials: true
});

export const authClient = axios.create({
   baseURL: import.meta.env.VITE_AUTH_URL,
   withCredentials: true
});
