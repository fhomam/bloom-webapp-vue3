import { authClient } from './index';

export async function getSession() {
   const response = await authClient.get('/session');
   return response.data;
}