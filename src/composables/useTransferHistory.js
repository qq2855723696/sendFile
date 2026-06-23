import { ref } from 'vue'

export function useTransferHistory() {
  const transferHistory = ref(JSON.parse(localStorage.getItem('sendfile.history') || '[]'))

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

