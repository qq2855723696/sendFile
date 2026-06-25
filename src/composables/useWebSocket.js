import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useWebSocket({ onOpen, onMessage, onDisconnect, onReconnect }) {
  const ws = ref(null)
  const wsReady = ref(false)
  const reconnectTimer = ref(null)

  function connectSocket() {
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const configuredUrl = import.meta.env.VITE_WS_URL
    // 开发模式：Vite 默认 5173，后端默认 3000；生产模式：同端口
    const devPort = location.port === '5173' ? ':3000' : (location.port ? `:${location.port}` : '')
    const socketUrl = configuredUrl || `${protocol}://${location.hostname}${devPort}`
    if (ws.value && [WebSocket.OPEN, WebSocket.CONNECTING].includes(ws.value.readyState)) return

    const socket = new WebSocket(socketUrl)
    ws.value = socket

    socket.onopen = () => {
      wsReady.value = true
      onOpen?.()
    }

    socket.onclose = () => {
      if (ws.value === socket) {
        wsReady.value = false
        ws.value = null
      }
      onDisconnect?.()
      if (!socket.manualClose) {
        onReconnect?.()
        reconnectTimer.value = setTimeout(connectSocket, 1200)
      }
    }

    socket.onerror = () => {
      wsReady.value = false
    }

    socket.onmessage = event => {
      // 单条异常消息不应中断后续消息处理
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      onMessage?.(data)
    }
  }

  function refreshSocket() {
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
    wsReady.value = false
    if (ws.value && [WebSocket.OPEN, WebSocket.CONNECTING].includes(ws.value.readyState)) {
      ws.value.manualClose = true
      ws.value.close()
    }
    ws.value = null
    setTimeout(connectSocket, 80)
  }

  function safeSend(payload) {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      ElMessage.warning('服务未连接，请稍候再试')
      return false
    }
    try {
      ws.value.send(JSON.stringify(payload))
      return true
    } catch {
      ElMessage.warning('消息发送失败')
      return false
    }
  }

  function closeSocket() {
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
    if (ws.value) ws.value.manualClose = true
    ws.value?.close()
  }

  return {
    ws,
    wsReady,
    reconnectTimer,
    connectSocket,
    refreshSocket,
    safeSend,
    closeSocket
  }
}
