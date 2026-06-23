import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 30000
})

request.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || error.response?.data || error.message || '请求失败'
    if (!error.config?.silent) ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request

export const rawRequest = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 0,
  responseType: 'blob'
})

