<template>
  <input id="fileInput" type="file" multiple hidden @change="handleFiles">
  <input id="folderInput" type="file" webkitdirectory hidden @change="handleFiles">

  <AppHeader
    :local-online="localOnline"
    :device-name="deviceName"
    :dark-mode="darkMode"
    :notify-permission="notifyPermission"
    :notify-enabled="notifyEnabled"
    @open-qr="showQrDialog = true"
    @open-history="showHistoryDialog = true"
    @disable-notify="disableNotify"
    @request-notify="requestNotifyPermission"
    @toggle-dark="toggleDark"
  />

  <main class="layout">
    <DevicePanel
      v-model:device-name="deviceName"
      v-model:pin-code="pinCode"
      v-model:device-status="deviceStatus"
      :ws-ready="wsReady"
      :local-online="localOnline"
      :loading="loading"
      @online="deviceOnline"
      @offline="deviceOffline"
      @status-change="updateMyStatus"
    />

    <section class="panel">
      <SessionLobby
        v-if="!isConnected"
        v-model:active-tab="activeTab"
        :is-connected="isConnected"
        :local-online="localOnline"
        :device-list="deviceList"
        :group-list="groupList"
        :radar="radar"
        @refresh="refreshSocket"
        @connect-device="connectDevice"
        @join-group="requestJoinGroup"
      />

      <FileManager
        v-else
        v-model:file-search="fileSearch"
        v-model:file-current-page="fileCurrentPage"
        :is-connected="isConnected"
        :current-session-id="currentSessionId"
        :current-session-members="currentSessionMembers"
        :other-uploads="otherUploads"
        :drag-active="dragActive"
        :uploading="uploading"
        :upload-progress="uploadProgress"
        :upload-speed-text="uploadSpeedText"
        :selected-keys="selectedKeys"
        :file-list="fileList"
        :filtered-file-list="filteredFileList"
        :paged-file-list="pagedFileList"
        :file-page-size="filePageSize"
        :sort-field="sortField"
        :sort-dir="sortDir"
        :folder-browse="folderBrowse"
        :current-folder-entry="currentFolderEntry"
        :folder-browse-rows="folderBrowseRows"
        :image-preview-list="imagePreviewList"
        :my-real-ip="myRealIp"
        :drag-over-idx="dragOverIdx"
        :chat-open="chatOpen"
        :unread-count="unreadCount"
        @open-clip="openClipDialog"
        @toggle-chat="toggleChat"
        @leave="backToList"
        @choose-files="chooseFiles"
        @choose-folder="chooseFolder"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop-files="onDropFiles"
        @batch-download="batchDownload"
        @clear-selection="selectedKeys = []"
        @toggle-sort="toggleSort"
        @clear-sort="sortField = ''"
        @toggle-select-all="toggleSelectAll"
        @folder-up="folderBrowseUp"
        @download-folder-zip="downloadFolderZip"
        @enter-sub-folder="enterSubFolder"
        @preview="previewFile"
        @download="downloadFile"
        @selection-change="onSelectionChange"
        @drag-start="onDragStart"
        @drag-enter-row="dragOverIdx = $event"
        @drag-leave-row="dragOverIdx = -1"
        @drag-drop="onDragDrop"
        @open-folder="openFolder"
        @copy-link="copyFileLink"
        @rename="openRenameDialog"
        @delete="deleteFile"
      />
    </section>
  </main>

  <MobileSettings
    v-model:open="settingsSheetOpen"
    v-model:device-name="deviceName"
    v-model:pin-code="pinCode"
    v-model:device-status="deviceStatus"
    :ws-ready="wsReady"
    :local-online="localOnline"
    :loading="loading"
    @online="deviceOnline"
    @offline="deviceOffline"
    @status-change="updateMyStatus"
  />

  <ChatDrawer
    ref="chatDrawerRef"
    v-model:chat-input="chatInput"
    :open="chatOpen"
    :messages="chatMessages"
    :my-real-ip="myRealIp"
    @close="chatOpen = false"
    @send="sendChat"
  />

  <PinDialog v-model:visible="showPinDialog" v-model:input-pin="inputPin" :target-device-name="targetDeviceName" @submit="submitPin" />
  <ConnectDialog v-model:visible="showConnectDialog" :incoming-request="incomingRequest" @reply="replyConnect" />
  <JoinDialog v-model:visible="showJoinDialog" :incoming-join="incomingJoin" @reply="replyJoin" />
  <WaitDialog v-model:visible="showWaitDialog" @cancel="cancelWait" />
  <PreviewDialog :preview="preview" @download="downloadFile" />
  <QrDialog v-model:visible="showQrDialog" :loading="qrLoading" :data="qrData" />
  <ClipDialog v-model:visible="showClipDialog" v-model:content="clipContent" @send="sendClip" />
  <ClipReceiveDialog v-model:visible="showClipReceive" :received-clip="receivedClip" @copy="copyClip" />
  <RenameDialog v-model:visible="showRenameDialog" v-model:rename-value="renameValue" @submit="submitRename" />
  <HistoryDialog v-model:visible="showHistoryDialog" :history="transferHistory" @clear="clearHistory" />
  <DownloadProgress :progress="downloadProgress" />
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import ChatDrawer from '@/components/ChatDrawer.vue'
import DevicePanel from '@/components/DevicePanel.vue'
import DownloadProgress from '@/components/DownloadProgress.vue'
import FileManager from '@/components/FileManager.vue'
import MobileSettings from '@/components/MobileSettings.vue'
import SessionLobby from '@/components/SessionLobby.vue'
import ClipDialog from '@/components/dialogs/ClipDialog.vue'
import ClipReceiveDialog from '@/components/dialogs/ClipReceiveDialog.vue'
import ConnectDialog from '@/components/dialogs/ConnectDialog.vue'
import HistoryDialog from '@/components/dialogs/HistoryDialog.vue'
import JoinDialog from '@/components/dialogs/JoinDialog.vue'
import PinDialog from '@/components/dialogs/PinDialog.vue'
import PreviewDialog from '@/components/dialogs/PreviewDialog.vue'
import QrDialog from '@/components/dialogs/QrDialog.vue'
import RenameDialog from '@/components/dialogs/RenameDialog.vue'
import WaitDialog from '@/components/dialogs/WaitDialog.vue'
import {
  beginFolderBatch,
  completeUpload,
  deleteFileEntry,
  downloadBatchZip,
  getDocxPreviewUrl,
  getFolderZipUrl,
  getTextFile,
  getUploadStatus,
  renameFileEntry,
  uploadChunk as uploadChunkApi
} from '@/api/file'
import { getQrCode } from '@/api/session'
import {
  CHUNK_CONCURRENCY,
  CHUNK_SIZE,
  LARGE_DOWNLOAD_SIZE,
  MAX_FILE_SIZE,
  MAX_TOTAL_UPLOAD_SIZE,
  TEXT_PREVIEW_CHARS,
  TEXT_PREVIEW_LIMIT
} from '@/constants'
import { useNotification } from '@/composables/useNotification'
import { useTheme } from '@/composables/useTheme'
import { useTransferHistory } from '@/composables/useTransferHistory'
import { useWebSocket } from '@/composables/useWebSocket'
import { fileFingerprint } from '@/utils/fingerprint'
import { buildFolderBrowseRows } from '@/utils/folder'
import { fileExtension, formatSize, isImageFile, previewMode } from '@/utils/format'
import { createUuid } from '@/utils/uuid'
import { downloadByLink, saveBlob } from '@/utils/download'

const loading = ref(false)
const deviceActionPending = ref(false)
const deviceActionTimer = ref(null)
const lastDeviceActionAt = ref(0)
const localOnline = ref(false)
const deviceName = ref(localStorage.getItem('sendfile.deviceName') || '')
const pinCode = ref('')
const deviceStatus = ref('online')
const myRealIp = ref('')
const deviceList = ref([])
const groupList = ref([])
const radar = ref({ onlineCount: 0, activeSessionCount: 0, activeTransferCount: 0, devices: [], sessions: [] })
const activeTab = ref('devices')

const isConnected = ref(false)
const currentSessionId = ref('')
const currentSessionMembers = ref([])
const fileList = ref([])
const fileSearch = ref('')
const selectedKeys = ref([])
const sortField = ref('uploadedAt')
const sortDir = ref('desc')
const filePageSize = ref(20)
const fileCurrentPage = ref(1)
const folderBrowse = ref(null)
const dragSrcIdx = ref(-1)
const dragOverIdx = ref(-1)

const showPinDialog = ref(false)
const showConnectDialog = ref(false)
const showJoinDialog = ref(false)
const showWaitDialog = ref(false)
const showQrDialog = ref(false)
const showClipDialog = ref(false)
const showClipReceive = ref(false)
const showRenameDialog = ref(false)
const showHistoryDialog = ref(false)
const settingsSheetOpen = ref(false)

const targetIpForPin = ref('')
const targetDeviceName = ref('')
const inputPin = ref('')
const incomingRequest = ref({})
const incomingJoin = ref({})
const waitTimer = ref(null)

const uploading = ref(false)
const uploadProgress = ref(0)
const uploadSpeedText = ref('')
const uploadStartTime = ref(0)
const uploadedBytes = ref(0)
const dragActive = ref(false)
const dragDepth = ref(0)
const otherUploads = ref([])

const preview = reactive({ visible: false, mode: '', name: '', url: '', text: '', row: null })
const chatOpen = ref(false)
const chatMessages = ref([])
const chatInput = ref('')
const unreadCount = ref(0)
const chatDrawerRef = ref(null)
const clipContent = ref('')
const receivedClip = ref({})
const renameTarget = ref(null)
const renameValue = ref('')
const qrLoading = ref(false)
const qrData = ref({})
const downloadProgress = reactive({ visible: false, name: '', percent: 0, loaded: 0, total: 0 })

const { darkMode, toggleDark } = useTheme()
const {
  notifyPermission,
  notifyEnabled,
  syncNotifyState,
  requestNotifyPermission,
  disableNotify,
  showNativeNotif
} = useNotification()
const { transferHistory, addHistory, clearHistory } = useTransferHistory()

const {
  wsReady,
  connectSocket,
  refreshSocket,
  safeSend,
  closeSocket
} = useWebSocket({
  onOpen: () => {
    if (localOnline.value) sendOnline(false)
  },
  onMessage: handleMessage,
  onDisconnect: () => {
    if (isConnected.value) {
      forceBackToList()
      ElMessage.warning('连接已断开，请重新上线并进入会话')
    }
  }
})

const currentFolderEntry = computed(() => {
  if (!folderBrowse.value) return null
  return fileList.value.find(file => file.kind === 'folder' && file.id === folderBrowse.value.folderId) || null
})

const folderBrowseRows = computed(() => (
  currentFolderEntry.value?.items ? buildFolderBrowseRows(currentFolderEntry.value.items, folderBrowse.value.subPath) : []
))

const filteredFileList = computed(() => {
  const query = fileSearch.value.trim().toLowerCase()
  const list = query ? fileList.value.filter(file => (file.name || '').toLowerCase().includes(query)) : fileList.value.slice()
  const field = sortField.value
  if (!field) return list
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    let av = a[field]
    let bv = b[field]
    if (field === 'name') {
      av = (av || '').toLowerCase()
      bv = (bv || '').toLowerCase()
      return av < bv ? -dir : av > bv ? dir : 0
    }
    return ((av || 0) - (bv || 0)) * dir
  })
  return list
})

const pagedFileList = computed(() => {
  const start = (fileCurrentPage.value - 1) * filePageSize.value
  return filteredFileList.value.slice(start, start + filePageSize.value)
})

const imagePreviewList = computed(() => filteredFileList.value.filter(file => isImageFile(file)).map(file => file.path))

watch(showQrDialog, visible => {
  if (visible) loadQrCode()
})

watch(chatOpen, visible => {
  if (visible) {
    unreadCount.value = 0
    scrollChat()
  }
})

watch(fileSearch, () => {
  fileCurrentPage.value = 1
})

watch(sortField, () => {
  fileCurrentPage.value = 1
})

watch(localOnline, online => {
  if (online) settingsSheetOpen.value = false
})

function resetDeviceAction() {
  loading.value = false
  deviceActionPending.value = false
  clearTimeout(deviceActionTimer.value)
  deviceActionTimer.value = null
}

function handleMessage(msg) {
  const handlers = {
    MY_IP: () => {
      myRealIp.value = msg.ip
    },
    ONLINE_RESULT: () => {
      resetDeviceAction()
      localOnline.value = true
      deviceName.value = msg.assignedName || deviceName.value
      localStorage.setItem('sendfile.deviceName', deviceName.value)
      if (msg.showToast !== false) ElMessage.success('设备已上线')
    },
    OFFLINE_RESULT: () => {
      resetDeviceAction()
      localOnline.value = false
      deviceList.value = []
      groupList.value = []
      radar.value = { onlineCount: 0, activeSessionCount: 0, activeTransferCount: 0, devices: [], sessions: [] }
      forceBackToList()
      ElMessage.success('设备已下线')
    },
    DEVICE_LIST: () => {
      deviceList.value = msg.list || []
    },
    GROUP_LIST: () => {
      groupList.value = msg.list || []
    },
    RADAR_STATE: () => {
      radar.value = { ...radar.value, ...msg }
    },
    CONNECT_NOTIFY: () => {
      incomingRequest.value = msg
      showConnectDialog.value = true
    },
    CONNECT_CANCELED: () => {
      showConnectDialog.value = false
      ElMessage.info(msg.message || '连接请求已取消')
    },
    CONNECT_RESULT: () => {
      clearWait()
      if (!msg.allow) ElMessage.warning(msg.message || '连接失败')
    },
    PIN_ERROR: () => {
      clearWait()
      ElMessage.error(msg.message || 'PIN 码错误')
    },
    SESSION_JOINED: () => {
      clearWait()
      applySession(msg.session)
      ElMessage.success('已进入文件传输会话')
    },
    SESSION_UPDATE: () => applySession(msg.session),
    SESSION_CLOSED: () => {
      forceBackToList()
      ElMessage.warning(msg.message || '会话已结束')
    },
    MEMBER_LEFT: () => ElMessage.warning(msg.message || '有成员离开会话'),
    MEMBER_JOINED: () => ElMessage.success(msg.message || '新成员已加入'),
    GROUP_JOIN_NOTIFY: () => {
      incomingJoin.value = msg
      showJoinDialog.value = true
    },
    GROUP_JOIN_RESULT: () => {
      if (msg.pending) ElMessage.info(msg.message)
      else if (msg.success) ElMessage.success(msg.message || '已加入会话')
      else ElMessage.warning(msg.message || '加入失败')
    },
    FILE_LIST: () => {
      const previous = fileList.value.length
      fileList.value = msg.list || []
      fileCurrentPage.value = 1
      const added = fileList.value.length - previous
      if (added > 0 && !document.hasFocus() && isConnected.value) showNativeNotif('📥 新文件', `收到 ${added} 个新文件`)
    },
    ERROR: () => ElMessage.error(msg.message || '服务端错误'),
    CHAT_MSG: () => {
      chatMessages.value.push(msg)
      if (!chatOpen.value) unreadCount.value += 1
      scrollChat()
      if (!document.hasFocus()) showNativeNotif(`💬 ${msg.fromName}`, String(msg.content || '').slice(0, 80))
    },
    CLIP_SHARE: () => {
      receivedClip.value = msg
      showClipReceive.value = true
    },
    UPLOAD_PROGRESS: () => {
      if (msg.uploaderIp === myRealIp.value) return
      const index = otherUploads.value.findIndex(upload => upload.uploadId === msg.uploadId)
      if (msg.done || msg.progress >= 100) {
        if (index >= 0) otherUploads.value.splice(index, 1)
      } else if (index >= 0) {
        otherUploads.value[index] = msg
      } else {
        otherUploads.value.push(msg)
      }
    }
  }
  handlers[msg.type]?.()
}

function deviceOnline() {
  if (!deviceName.value.trim()) {
    ElMessage.warning('请输入设备名称')
    return
  }
  if (!canRunDeviceAction('上线')) return
  loading.value = true
  lockDeviceAction()
  sendOnline(true)
}

function sendOnline(showToast) {
  safeSend({
    type: 'ONLINE',
    name: deviceName.value.trim(),
    status: deviceStatus.value,
    pin: pinCode.value.trim(),
    showToast
  })
}

function deviceOffline() {
  if (!canRunDeviceAction('下线')) return
  loading.value = true
  lockDeviceAction()
  safeSend({ type: 'OFFLINE' })
}

function canRunDeviceAction(name) {
  if (deviceActionPending.value) {
    ElMessage.warning(`正在处理${name}请求，请勿重复点击`)
    return false
  }
  if (Date.now() - lastDeviceActionAt.value < 1200) {
    ElMessage.warning('操作太频繁，请稍后再试')
    return false
  }
  if (!wsReady.value) {
    ElMessage.warning('服务连接中，请稍后再试')
    return false
  }
  lastDeviceActionAt.value = Date.now()
  return true
}

function lockDeviceAction() {
  deviceActionPending.value = true
  clearTimeout(deviceActionTimer.value)
  deviceActionTimer.value = setTimeout(() => {
    loading.value = false
    deviceActionPending.value = false
    ElMessage.warning('服务响应超时，请检查连接后重试')
  }, 8000)
}

function updateMyStatus() {
  if (localOnline.value && wsReady.value) safeSend({ type: 'UPDATE_STATUS', status: deviceStatus.value })
}

function connectDevice(row) {
  if (!localOnline.value) {
    ElMessage.warning('请先上线本机设备')
    return
  }
  targetIpForPin.value = row.ip
  targetDeviceName.value = row.name
  if (row.hasPin) {
    inputPin.value = ''
    showPinDialog.value = true
  } else {
    sendConnectRequest(row.ip, '')
  }
}

function submitPin() {
  if (!inputPin.value.trim()) {
    ElMessage.warning('请输入 PIN 码')
    return
  }
  showPinDialog.value = false
  sendConnectRequest(targetIpForPin.value, inputPin.value.trim())
}

function sendConnectRequest(targetIp, pin) {
  showWaitDialog.value = true
  clearTimeout(waitTimer.value)
  waitTimer.value = setTimeout(() => {
    showWaitDialog.value = false
    ElMessage.warning('连接超时，对方未响应')
  }, 30000)
  safeSend({ type: 'CONNECT_REQ', targetIp, pin, timestamp: Date.now() })
}

function replyConnect(allow) {
  safeSend({
    type: 'CONNECT_RES',
    toIp: incomingRequest.value.fromIp,
    allow,
    message: allow ? '对方已同意连接' : '对方拒绝了连接'
  })
  showConnectDialog.value = false
}

function requestJoinGroup(row) {
  if (!localOnline.value) {
    ElMessage.warning('请先上线本机设备')
    return
  }
  if (isConnected.value) {
    ElMessage.warning('你已在会话中，请先离开当前会话')
    return
  }
  safeSend({ type: 'GROUP_JOIN_REQ', groupId: row.id })
}

function replyJoin(allow) {
  safeSend({
    type: 'GROUP_JOIN_RES',
    requesterIp: incomingJoin.value.requesterIp,
    groupId: incomingJoin.value.groupId,
    allow
  })
  showJoinDialog.value = false
}

function cancelWait() {
  if (targetIpForPin.value) safeSend({ type: 'CONNECT_CANCEL', targetIp: targetIpForPin.value, message: '对方取消了连接请求' })
  clearWait()
}

function clearWait() {
  showWaitDialog.value = false
  clearTimeout(waitTimer.value)
  waitTimer.value = null
}

function applySession(session) {
  if (!session) return
  isConnected.value = true
  currentSessionId.value = session.id
  currentSessionMembers.value = session.members || []
  fileList.value = session.files || []
  fileCurrentPage.value = 1
  folderBrowse.value = null
}

function backToList() {
  safeSend({ type: 'DISCONNECT', message: `${deviceName.value} 已离开会话` })
  forceBackToList()
}

function forceBackToList() {
  isConnected.value = false
  currentSessionId.value = ''
  currentSessionMembers.value = []
  fileList.value = []
  fileCurrentPage.value = 1
  folderBrowse.value = null
  chatMessages.value = []
  chatOpen.value = false
  unreadCount.value = 0
  otherUploads.value = []
  selectedKeys.value = []
  downloadProgress.visible = false
  clearWait()
  showPinDialog.value = false
  showConnectDialog.value = false
  showJoinDialog.value = false
}

function chooseFiles() {
  document.getElementById('fileInput')?.click()
}

function chooseFolder() {
  document.getElementById('folderInput')?.click()
}

async function handleFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (files.length) await uploadFiles(files)
}

function onDragEnter() {
  dragDepth.value += 1
  dragActive.value = true
}

function onDragOver() {
  dragActive.value = true
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  dragActive.value = dragDepth.value > 0
}

function onDropFiles(event) {
  dragDepth.value = 0
  dragActive.value = false
  const items = Array.from(event.dataTransfer?.items || [])
  if (items.some(item => item.webkitGetAsEntry?.()?.isDirectory)) {
    ElMessage.warning('拖拽暂不支持文件夹，请点击"选择文件夹"')
    return
  }
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length) uploadFiles(files)
}

function detectFolderUpload(files) {
  const path = files[0]?.webkitRelativePath
  if (!path) return null
  return { batchId: createUuid(), rootName: path.replace(/\\/g, '/').split('/')[0], fileCount: files.length }
}

async function uploadFiles(files) {
  if (!isConnected.value) {
    ElMessage.warning('请先进入会话')
    return
  }
  const oversize = files.find(file => file.size > MAX_FILE_SIZE)
  if (oversize) {
    ElMessage.error(`文件超过限制：${oversize.name}`)
    return
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_UPLOAD_SIZE) {
    ElMessage.error('单次上传总大小不能超过 2GB')
    return
  }

  const folderMeta = detectFolderUpload(files)
  uploading.value = true
  uploadProgress.value = 0
  uploadStartTime.value = Date.now()
  uploadedBytes.value = 0
  uploadSpeedText.value = ''

  try {
    await uploadByChunks(files, folderMeta)
    uploadProgress.value = 100
    ElMessage.success('上传完成')
    addHistory(files, true)
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
    addHistory(files, false)
  } finally {
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
      uploadSpeedText.value = ''
    }, 800)
  }
}

async function uploadByChunks(files, folderMeta) {
  if (folderMeta) {
    const result = await beginFolderBatch({
      sessionId: currentSessionId.value,
      uploaderIp: myRealIp.value,
      batchId: folderMeta.batchId,
      rootName: folderMeta.rootName,
      fileCount: folderMeta.fileCount
    })
    if (result?.success === false) throw new Error(result.message || '无法开始文件夹上传')
  }

  const jobs = await Promise.all(files.map(async file => {
    const uploadId = fileFingerprint(file)
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
    let done = new Set()
    try {
      const status = await getUploadStatus(uploadId)
      done = new Set(status.chunks || [])
    } catch {
      done = new Set()
    }
    return { file, uploadId, totalChunks, done }
  }))

  const tasks = jobs.flatMap(job => Array.from({ length: job.totalChunks }, (_, chunkIndex) => ({ ...job, chunkIndex }))
    .filter(task => !task.done.has(task.chunkIndex)))
  let finished = 0
  const totalTasks = tasks.length || 1
  let cursor = 0

  const worker = async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor]
      cursor += 1
      await uploadChunk(task)
      finished += 1
      uploadProgress.value = Math.min(97, Math.round((finished / totalTasks) * 100))
    }
  }

  await Promise.all(Array.from({ length: Math.min(CHUNK_CONCURRENCY, Math.max(1, tasks.length)) }, worker))

  for (const job of jobs) {
    const result = await completeUpload(folderMeta ? { uploadId: job.uploadId, folderBatchId: folderMeta.batchId } : { uploadId: job.uploadId })
    if (result?.success === false) throw new Error(result.message || '文件合并失败')
  }
}

async function uploadChunk(task) {
  const start = task.chunkIndex * CHUNK_SIZE
  const chunkBlob = task.file.slice(start, Math.min(start + CHUNK_SIZE, task.file.size))
  const form = new FormData()
  form.append('chunk', chunkBlob)
  form.append('uploadId', task.uploadId)
  form.append('chunkIndex', String(task.chunkIndex))
  form.append('totalChunks', String(task.totalChunks))
  form.append('fileName', task.file.name)
  form.append('relativePath', task.file.webkitRelativePath || task.file.name)
  form.append('fileSize', String(task.file.size))
  form.append('fileType', task.file.type || '')
  form.append('sessionId', currentSessionId.value)
  form.append('uploaderIp', myRealIp.value)

  const result = await uploadChunkApi(form)
  if (result?.success === false) throw new Error(result.message || '分片上传失败')
  uploadedBytes.value += chunkBlob.size
  const elapsed = (Date.now() - uploadStartTime.value) / 1000
  if (elapsed > 0) uploadSpeedText.value = `${formatSize(uploadedBytes.value / elapsed)}/s`
}

function onSelectionChange(rows) {
  selectedKeys.value = rows.map(row => row.path || row.id)
}

function toggleSelectAll() {
  if (selectedKeys.value.length === filteredFileList.value.length && filteredFileList.value.length > 0) {
    selectedKeys.value = []
  } else {
    selectedKeys.value = filteredFileList.value.map(file => file.path || file.id)
  }
}

async function batchDownload() {
  if (!selectedKeys.value.length) return
  const response = await downloadBatchZip({
    sessionId: currentSessionId.value,
    requesterIp: myRealIp.value,
    fileKeys: selectedKeys.value
  })
  saveBlob(response.data, `sendfile_batch_${Date.now()}.zip`)
}

async function deleteFile(row) {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？此操作不可恢复`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  const result = await deleteFileEntry({
    sessionId: currentSessionId.value,
    uploaderIp: myRealIp.value,
    filePath: row.path || '',
    fileId: row.id || ''
  })
  if (result.success) ElMessage.success('已删除')
}

function openRenameDialog(row) {
  renameTarget.value = row
  renameValue.value = row.name
  showRenameDialog.value = true
}

async function submitRename() {
  if (!renameValue.value.trim()) {
    ElMessage.warning('文件名不能为空')
    return
  }
  const row = renameTarget.value
  const result = await renameFileEntry({
    sessionId: currentSessionId.value,
    uploaderIp: myRealIp.value,
    filePath: row.path || '',
    fileId: row.id || '',
    newName: renameValue.value.trim()
  })
  if (result.success) {
    ElMessage.success('已重命名')
    showRenameDialog.value = false
  }
}

function openFolder(row) {
  folderBrowse.value = { folderId: row.id, subPath: '' }
}

function folderBrowseUp() {
  if (!folderBrowse.value?.subPath) {
    folderBrowse.value = null
    return
  }
  const parts = folderBrowse.value.subPath.split('/').filter(Boolean)
  parts.pop()
  folderBrowse.value.subPath = parts.join('/')
}

function enterSubFolder(name) {
  folderBrowse.value.subPath = folderBrowse.value.subPath ? `${folderBrowse.value.subPath}/${name}` : name
}

function downloadFile(row) {
  if (!row) return
  const name = String(row.name || 'file').split('/').pop()
  const total = Number(row.size || 0)
  if (!total || total < LARGE_DOWNLOAD_SIZE) {
    downloadByLink(row.path, name)
    return
  }

  downloadProgress.visible = true
  downloadProgress.name = name
  downloadProgress.percent = 0
  downloadProgress.loaded = 0
  downloadProgress.total = total

  fetch(row.path)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const reader = response.body.getReader()
      const chunks = []
      let loaded = 0
      const pump = () => reader.read().then(({ done, value }) => {
        if (done) {
          downloadProgress.percent = 100
          saveBlob(new Blob(chunks, { type: 'application/octet-stream' }), name)
          return
        }
        chunks.push(value)
        loaded += value.length
        downloadProgress.loaded = loaded
        downloadProgress.percent = Math.min(99, Math.round((loaded / total) * 100))
        return pump()
      })
      return pump()
    })
    .catch(error => {
      ElMessage.error(`下载失败：${error.message || '未知错误'}`)
    })
    .finally(() => {
      setTimeout(() => {
        downloadProgress.visible = false
      }, 1200)
    })
}

function downloadFolderZip(row) {
  if (!row?.id) return
  location.href = getFolderZipUrl(currentSessionId.value, row.id, myRealIp.value)
}

async function previewFile(row) {
  const mode = previewMode(row)
  preview.visible = true
  preview.mode = mode
  preview.name = row.name || '文件预览'
  preview.url = mode === 'docx' ? getDocxPreviewUrl(row.path) : row.path
  preview.text = ''
  preview.row = row

  if (mode === 'unsupported') {
    ElMessage.info('该文件类型暂不支持在线预览')
    return
  }
  if (mode === 'text') {
    if (row.size > TEXT_PREVIEW_LIMIT) {
      preview.mode = 'unsupported'
      ElMessage.warning('文本文件过大，请下载后查看')
      return
    }
    try {
      const text = await getTextFile(row.path)
      preview.text = text.length > TEXT_PREVIEW_CHARS ? `${text.slice(0, TEXT_PREVIEW_CHARS)}\n\n…内容过长，仅预览前 200KB` : text
    } catch {
      preview.text = '文本读取失败'
    }
  }
}

function toggleChat() {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value) {
    unreadCount.value = 0
    scrollChat()
  }
}

function sendChat() {
  if (!isConnected.value || !wsReady.value) {
    ElMessage.warning('请先进入会话')
    return
  }
  const content = chatInput.value.trim()
  if (!content) return
  safeSend({ type: 'CHAT_MSG', content })
  chatInput.value = ''
}

function scrollChat() {
  nextTick(() => chatDrawerRef.value?.scrollChat?.())
}

function openClipDialog() {
  clipContent.value = ''
  showClipDialog.value = true
}

function sendClip() {
  if (!isConnected.value || !wsReady.value) {
    ElMessage.warning('请先进入会话')
    return
  }
  if (!clipContent.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  safeSend({ type: 'CLIP_SHARE', content: clipContent.value.trim() })
  showClipDialog.value = false
  ElMessage.success('已发送给所有成员')
}

async function copyClip(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('请手动选中复制')
  }
  showClipReceive.value = false
}

async function loadQrCode() {
  qrLoading.value = true
  try {
    qrData.value = await getQrCode()
  } catch {
    ElMessage.error('二维码生成失败')
  } finally {
    qrLoading.value = false
  }
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = field === 'name' ? 'asc' : 'desc'
  }
}

function onPaste(event) {
  if (!isConnected.value) return
  const items = Array.from((event.clipboardData || event.originalEvent?.clipboardData)?.items || [])
  const files = items.filter(item => item.kind === 'file').map(item => item.getAsFile()).filter(Boolean)
  if (!files.length) return
  event.preventDefault()
  ElMessage.info(`粘贴上传 ${files.length} 个文件`)
  uploadFiles(files)
}

function onDragStart(index) {
  dragSrcIdx.value = index
}

function onDragDrop(index) {
  dragOverIdx.value = -1
  if (dragSrcIdx.value < 0 || dragSrcIdx.value === index) {
    dragSrcIdx.value = -1
    return
  }
  const source = pagedFileList.value[dragSrcIdx.value]
  const target = pagedFileList.value[index]
  if (!source || !target) {
    dragSrcIdx.value = -1
    return
  }
  const sourceIndex = fileList.value.indexOf(source)
  const targetIndex = fileList.value.indexOf(target)
  if (sourceIndex < 0 || targetIndex < 0) {
    dragSrcIdx.value = -1
    return
  }
  fileList.value.splice(sourceIndex, 1)
  fileList.value.splice(targetIndex, 0, source)
  sortField.value = ''
  dragSrcIdx.value = -1
}

async function copyFileLink(row) {
  if (!row?.path) {
    ElMessage.warning('文件链接不可用')
    return
  }
  const url = location.origin + row.path
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('下载链接已复制 ✓')
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      ElMessage.success('下载链接已复制 ✓')
    } catch {
      ElMessage.info(`链接：${url}`)
    }
    document.body.removeChild(input)
  }
}

onMounted(() => {
  connectSocket()
  syncNotifyState()
  window.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  if (isConnected.value) safeSend({ type: 'DISCONNECT', message: `${deviceName.value} 已离开页面` })
  clearTimeout(deviceActionTimer.value)
  clearTimeout(waitTimer.value)
  closeSocket()
  window.removeEventListener('paste', onPaste)
})
</script>

