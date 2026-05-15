import { appClient } from './index'

export async function submitFeedback(payload) {
  const response = await appClient.post('/api/v1/system/feedback', payload)
  return response.data
}