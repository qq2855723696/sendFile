import { ref } from 'vue'

export function useTransferHistory() {
  let stored = []
  try {
    stored = JSON.parse(localStorage.getItem('sendfile.history') || '[]')
  } catch { /* 忽略损坏的历史数据 */ }
  const transferHistory = ref(Array.isArray(stored) ? stored : [])

  function addHistory(files, ok) {
    const now = new Date().toLocaleString('zh-CN')
    for (const file of files) transferHistory.value.unshift({ name: file.name, size: file.size, time: now, ok })
    if (transferHistory.value.length > 200) transferHistory.value = transferHistory.value.slice(0, 200)
    localStorage.setItem('sendfile.history', JSON.stringify(transferHistory.value))
  }

  function clearHistory() {
    transferHistory.value = []
    localStorage.removeItem('sendfile.history')
  }

  return { transferHistory, addHistory, clearHistory }
}

