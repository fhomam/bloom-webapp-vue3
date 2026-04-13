import { appClient } from './index';

export async function getUserProfile(payload) {
   const response = await appClient.get('/api/v1/profile', { params: payload });
   return response.data;
}

export async function getBloom(payload) {
   const response = await appClient.post(`/api/v1/get/bloom`, payload);
   return response.data.value || response.data;
}

export async function getAppOffering(payload) {
   const response = await appClient.post(`/api/v1/get/offering/context`, payload);
   return response.data.value || response.data;
}

export async function getBloomSnippets(payload) {
   const response = await appClient.post(`/api/v1/get/bloom/snippets`, payload);
   return response.data.value || response.data;
}

export async function getBloomSourceInteractionStats(payload) {
   const response = await appClient.post(`/api/v1/get/bloom/source/interaction/stats`, payload);
   return response.data.value || response.data;
}

export async function getBloomSourcesWithVersion(payload) {
   const response = await appClient.post(`/api/v1/get/bloom/source/versions`, payload);
   return response.data.value || response.data;
}

export async function getAllThemes(payload) {
   const response = await appClient.post(`/api/v1/get/themes`, payload);
   return response.data.value || response.data;
}

export const getAvailableBlooms = async () => {
   const response = await appClient.post('/api/v1/get/available/blooms')
   return response.data.value || response.data
}

