import axios from 'axios'

export const appClient = axios.create({
   baseURL: import.meta.env.VITE_APP_URL,
   withCredentials: true
})

export const authClient = axios.create({
   baseURL: import.meta.env.VITE_AUTH_URL,
   withCredentials: true
})

async function getAppStore() {
  const { useAppStore } = await import('@/stores/app')
  return useAppStore()
}

function attachLoadingInterceptors(client) {
  client.interceptors.request.use(
    async (config) => {
      const store = await getAppStore()
      store.startLoading()
      return config
    },
    async (error) => {
      const store = await getAppStore()
      store.stopLoading()
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    async (response) => {
      const store = await getAppStore()
      store.stopLoading()
      return response
    },
    async (error) => {
      const store = await getAppStore()
      store.stopLoading()
      return Promise.reject(error)
    }
  )
}

attachLoadingInterceptors(appClient)
attachLoadingInterceptors(authClient)