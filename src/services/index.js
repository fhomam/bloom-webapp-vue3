import axios from 'axios';

export const appClient = axios.create({
   baseURL: 'http://app.withbloom.localhost:8000',
   withCredentials: true
});

export const authClient = axios.create({
   baseURL: 'http://auth.withbloom.localhost:8000',
   withCredentials: true
});
