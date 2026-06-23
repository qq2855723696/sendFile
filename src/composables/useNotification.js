import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useNotification() {
  const notifyPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
  const notifyEnabled = ref(
    typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      localStorage.getItem('sendfile.notify') !== '0'
  )

  function isElectron() {
    return typeof process !== 'undefined' && typeof process.versions !== 'undefined' && process.versions.electron != null
  }

  function syncNotifyState() {
    if (typeof Notification === 'undefined') return
    const permission = Notification.permission
    notifyPermission.value = permission
    if (permission === 'granted') {
      notifyEnabled.value = localStorage.getItem('sendfile.notify') !== '0'
    } else {
      notifyEnabled.value = false
      if (permission !== 'denied') localStorage.removeItem('sendfile.notify')
    }
  }

  async function requestNotifyPermission() {
    if (typeof Notification === 'undefined') {
      ElMessage.warning('当前环境不支持桌面通知')
      return
    }
    if (Notification.permission === 'denied') {
      ElMessage({
        message: isElectron()
          ? '权限已被系统阻止，请到系统设置→通知中手动开启'
          : '权限已被浏览器阻止，请到浏览器设置→隐私和安全→通知中手动开启',
        type: 'warning',
        duration: 6000,
        showClose: true
      })
      return
    }
    if (Notification.permission === 'granted') {
      notifyEnabled.value = true
      localStorage.setItem('sendfile.notify', '1')
      ElMessage.success('桌面通知已开启！')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      notifyPermission.value = permission
      if (permission === 'granted') {
        notifyEnabled.value = true
        localStorage.setItem('sendfile.notify', '1')
        ElMessage.success('桌面通知已开启！')
      } else if (permission === 'denied') {
        notifyEnabled.value = false
        ElMessage({ message: '已拒绝授权，通知无法开启', type: 'warning', duration: 4000, showClose: true })
      } else {
        ElMessage({ message: '未选择权限，可稍后再试', type: 'info', duration: 3000 })
      }
    } catch (error) {
      ElMessage.error(`请求通知权限失败：${error.message}`)
    }
  }

  function disableNotify() {
    notifyEnabled.value = false
    localStorage.setItem('sendfile.notify', '0')
    ElMessage.success('桌面通知已关闭')
  }

  function showNativeNotif(title, body) {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted' || !notifyEnabled.value) return
    try {
      const notification = new Notification(title, { body })
      setTimeout(() => notification.close(), 3000)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      if (isElectron()) console.warn('[Electron] 通知发送失败:', error.message)
    }
  }

  return {
    notifyPermission,
    notifyEnabled,
    syncNotifyState,
    requestNotifyPermission,
    disableNotify,
    showNativeNotif
  }
}

