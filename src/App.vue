<template>
  <input id="fileInput" type="file" multiple hidden @change="handleFiles">
  <input id="folderInput" type="file" webkitdirectory hidden @change="handleFiles">

  <AppHeader
    :local-online="localOnline"
    :device-name="deviceName"
    :dark-mode="darkMode"
    :notify-permission="notifyPermission"
    :notify-enabled="notifyEnabled"
    :current-language="currentLanguage"
    :supported-languages="supportedLanguages"
    :connection-status="connectionStatus"
    :network-latency="networkLatency"
    @open-qr="showQrDialog = true"
    @open-history="showHistoryDialog = true"
    @disable-notify="disableNotify"
    @request-notify="requestNotifyPermission"
    @toggle-dark="toggleDark"
    @change-language="handleLanguageChange"
  />

  <main class="layout">
    <DevicePanel
      v-model:device-name="deviceName"
      v-model:pin-code="pinCode"
      v-model:device-status="deviceStatus"
      :ws-ready="wsReady"
      :local-online="localOnline"
      :loading="loading"
      :my-real-ip="myRealIp"
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
        v-model:file-page-size="filePageSize"
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

  <!-- 移动端设置抽屉 -->
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

  <!-- 聊天抽屉 -->
  <ChatDrawer
    ref="chatDrawerRef"
    v-model:chat-input="chatInput"
    :open="chatOpen"
    :messages="chatMessages"
    :my-real-ip="myRealIp"
    @close="chatOpen = false"
    @send="sendChat"
  />

  <!-- 首次使用引导 -->
  <GuideTooltip
    :visible="isGuideVisible"
    :steps="guideSteps"
    @next="handleGuideNext"
    @skip="handleGuideSkip"
    @complete="handleGuideComplete"
  />

  <!-- 页面底部 -->
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <svg class="footer-logo-svg" viewBox="0 0 40 40" width="20" height="20">
          <defs>
            <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="32" height="28" rx="5" fill="url(#footerLogoGrad)"/>
          <rect x="10" y="12" width="20" height="3" rx="1.5" fill="#fff" opacity="0.9"/>
          <rect x="10" y="18" width="15" height="2.5" rx="1.25" fill="#fff" opacity="0.55"/>
          <circle cx="30" cy="30" r="8" fill="#10b981"/>
          <path d="M26 30l3 3 5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <strong>SendFile</strong>
        <span class="footer-badge">v2.0.0</span>
      </div>

      <div class="footer-links">
        <a class="footer-link" href="#" title="局域网文件快传">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
          文档
        </a>
        <a class="footer-link" href="#" title="MIT 开源协议">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          MIT License
        </a>
      </div>

      <span class="footer-copy">© 2026 SendFile</span>
    </div>
  </footer>

  <!-- 其他对话框 -->
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

  <!-- 全局通知 -->
  <NotificationContainer :notifications="notifications" @dismiss="dismissNotification" />
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
import GuideTooltip from '@/components/GuideTooltip.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
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
  ANIMATION_DURATION,
  CHUNK_CONCURRENCY,
  CHUNK_SIZE,
  DEFAULT_LANGUAGE,
  GUIDE_SHOWN_KEY,
  GUIDE_STEPS,
  LARGE_DOWNLOAD_SIZE,
  MAX_FILE_SIZE,
  MAX_TOTAL_UPLOAD_SIZE,
  MAX_VERSIONS_PER_FILE,
  NOTIFICATION_DURATION,
  SESSION_NOTE_KEY,
  TEXT_PREVIEW_CHARS,
  TEXT_PREVIEW_LIMIT,
  VERSION_HISTORY_KEY
} from '@/constants'
import { useGuide } from '@/composables/useGuide'
import { useKeyboard } from '@/composables/useKeyboard'
import { useLanguage } from '@/composables/useLanguage'
import { useNotification } from '@/composables/useNotification'
import { useTheme } from '@/composables/useTheme'
import { useTransferHistory } from '@/composables/useTransferHistory'
import { useWebSocket } from '@/composables/useWebSocket'
import { fileFingerprint } from '@/utils/fingerprint'
import { buildFolderBrowseRows } from '@/utils/folder'
import { fileExtension, formatSize, isImageFile, previewMode } from '@/utils/format'
import { createUuid } from '@/utils/uuid'
import { downloadByLink, saveBlob } from '@/utils/download'

// ========== 状态 ==========
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

// 对话框状态
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

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadSpeedText = ref('')
const uploadStartTime = ref(0)
const uploadedBytes = ref(0)
const dragActive = ref(false)
const dragDepth = ref(0)
const otherUploads = ref([])

// 预览和聊天
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

// 新功能状态
const guideSteps = ref(GUIDE_STEPS)
const currentGuideStep = ref(0)
const sessionNotes = ref({})
const fileVersions = ref({})
const showVersionHistory = ref(false)
const notifications = ref([])
const connectionStatus = ref('disconnected')
const networkLatency = ref(0)
const supportedLanguages = ref([
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' }
])

// ========== Composables ==========
const { t } = useLanguage()
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
const { setLanguage, getCurrentLanguage } = useLanguage()
// 语言选择器状态（独立 ref，通过 setLanguage 与 i18n 模块保持同步）
const currentLanguage = ref(getCurrentLanguage())
watch(currentLanguage, lang => setLanguage(lang))
const { isGuideShown, isGuideVisible, showGuide, hideGuide, completeGuide, skipGuide, resetGuide } = useGuide()

const {
  wsReady,
  connectSocket,
  refreshSocket,
  safeSend,
  closeSocket
} = useWebSocket({
  onOpen: () => {
    connectionStatus.value = 'connected'
    if (localOnline.value) sendOnline(false)
    startLatencyCheck()
  },
  onMessage: handleMessage,
  onDisconnect: () => {
    connectionStatus.value = 'disconnected'
    stopLatencyCheck()
    if (isConnected.value) {
      forceBackToList()
      ElMessage.warning(t('device.disconnected'))
    }
  },
  onReconnect: () => {
    connectionStatus.value = 'reconnecting'
  }
})

// 键盘快捷键
useKeyboard({
  upload: () => chooseFiles(),
  clipboard: () => openClipDialog(),
  search: () => document.querySelector('.toolbar input')?.focus(),
  close: () => {
    if (showHistoryDialog.value) showHistoryDialog.value = false
    else if (showQrDialog.value) showQrDialog.value = false
  },
  selectAll: () => toggleSelectAll()
})

// ========== Computed ==========
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

// ========== 方法 ==========
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
      localStorage.setItem('sendfile.myIp', msg.ip)
    },
    ONLINE_RESULT: () => {
      resetDeviceAction()
      localOnline.value = true
      deviceName.value = msg.assignedName || deviceName.value
      localStorage.setItem('sendfile.deviceName', deviceName.value)
      if (msg.showToast !== false) ElMessage.success(t('device.deviceOnline'))
      addNotification('success', t('device.deviceOnline'), t('device.deviceOnlineDesc'))
    },
    OFFLINE_RESULT: () => {
      resetDeviceAction()
      localOnline.value = false
      deviceList.value = []
      groupList.value = []
      radar.value = { onlineCount: 0, activeSessionCount: 0, activeTransferCount: 0, devices: [], sessions: [] }
      forceBackToList()
      ElMessage.success(t('device.deviceOffline'))
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
      ElMessage.success(t('session.sessionJoined'))
      addNotification('success', t('session.sessionJoined'), t('session.sessionJoinedDesc'))
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
      if (added > 0 && !document.hasFocus() && isConnected.value) {
        showNativeNotif(t('notifications.newFile'), t('notifications.newFileDesc', { count: added }))
        addNotification('info', '收到新文件', `收到 ${added} 个新文件`)
      }
    },
    PONG: () => {
      if (msg.t) networkLatency.value = Date.now() - msg.t
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
    ElMessage.warning(t('device.nameRequired'))
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
    ElMessage.warning(t('errors.tooFrequent'))
    return false
  }
  if (!wsReady.value) {
    ElMessage.warning(t('errors.serverConnecting'))
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
    ElMessage.warning(t('errors.serverTimeout'))
  }, 8000)
}

function updateMyStatus() {
  if (localOnline.value && wsReady.value) safeSend({ type: 'UPDATE_STATUS', status: deviceStatus.value })
}

function connectDevice(row) {
  if (!localOnline.value) {
    ElMessage.warning(t('device.pleaseOnline'))
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
    ElMessage.warning(t('device.pinRequired'))
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
    ElMessage.warning(t('device.connectTimeout'))
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
    ElMessage.warning(t('device.pleaseOnline'))
    return
  }
  if (isConnected.value) {
    ElMessage.warning(t('session.pleaseLeaveFirst'))
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
    ElMessage.warning(t('file.dragFolderNotSupported'))
    return
  }
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length) uploadFiles(files)
}

function detectFolderUpload(files) {
  const relPath = files[0]?.webkitRelativePath
  if (!relPath) return null
  const normalized = relPath.replace(/\\/g, '/')
  const slashIdx = normalized.indexOf('/')
  // 必须包含路径分隔符才是真正的文件夹上传（根目录文件无路径分隔符）
  if (slashIdx < 0) return null
  return { batchId: createUuid(), rootName: normalized.split('/')[0], fileCount: files.length }
}

async function uploadFiles(files) {
  if (!isConnected.value) {
    ElMessage.warning(t('session.notInSession'))
    return
  }
  const oversize = files.find(file => file.size > MAX_FILE_SIZE)
  if (oversize) {
    ElMessage.error(`文件超过限制：${oversize.name}`)
    return
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_UPLOAD_SIZE) {
    ElMessage.error(t('file.totalSizeLimit'))
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
    ElMessage.success(t('file.uploadComplete'))
    addHistory(files, true)
    addNotification('success', t('file.uploadComplete'), t('file.uploadCompleteDesc', { count: files.length }))
  } catch (error) {
    ElMessage.error(error.message || '上传失败')
    addHistory(files, false)
    addNotification('error', t('file.uploadFailed'), error.message || t('errors.unknownError'))
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
  try {
    const response = await downloadBatchZip({
      sessionId: currentSessionId.value,
      requesterIp: myRealIp.value,
      fileKeys: selectedKeys.value
    })
    saveBlob(response.data, `sendfile_batch_${Date.now()}.zip`)
    addNotification('success', t('file.batchDownload'), t('file.batchDownloadReady'))
  } catch (error) {
    ElMessage.error(t('file.batchDownloadFailed'))
    addNotification('error', t('file.batchDownloadFailed'), error.message || t('errors.unknownError'))
  }
}

async function deleteFile(row) {
  try {
    await ElMessageBox.confirm(t('file.confirmDelete', { name: row.name }), t('common.delete'), { type: 'warning' })
  } catch {
    return
  }
  try {
    const result = await deleteFileEntry({
      sessionId: currentSessionId.value,
      uploaderIp: myRealIp.value,
      filePath: row.path || '',
      fileId: row.id || ''
    })
    if (result.success) {
      ElMessage.success(t('file.deleteSuccess'))
      addNotification('success', t('file.deleteSuccess'), t('file.deleteSuccessDesc', { name: row.name }))
    }
  } catch (error) {
    addNotification('error', '删除失败', error.response?.data?.message || error.message || '未知错误')
  }
}

function openRenameDialog(row) {
  renameTarget.value = row
  renameValue.value = row.name
  showRenameDialog.value = true
}

async function submitRename() {
  if (!renameValue.value.trim()) {
    ElMessage.warning(t('file.nameRequired'))
    return
  }
  const row = renameTarget.value
  try {
    const result = await renameFileEntry({
      sessionId: currentSessionId.value,
      uploaderIp: myRealIp.value,
      filePath: row.path || '',
      fileId: row.id || '',
      newName: renameValue.value.trim()
    })
    if (result.success) {
      ElMessage.success(t('file.renameSuccess'))
      showRenameDialog.value = false
    }
  } catch (error) {
    addNotification('error', t('file.renameFailed'), error.response?.data?.message || error.message || t('errors.unknownError'))
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
  const newPath = parts.join('/')
  if (!newPath) {
    folderBrowse.value = null
  } else {
    folderBrowse.value.subPath = newPath
  }
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
    ElMessage.info(t('file.previewUnsupported'))
    return
  }
  if (mode === 'text') {
    if (row.size > TEXT_PREVIEW_LIMIT) {
      preview.mode = 'unsupported'
      ElMessage.warning(t('file.textFileTooLarge'))
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
    ElMessage.warning(t('session.notInSession'))
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
    ElMessage.warning(t('session.notInSession'))
    return
  }
  if (!clipContent.value.trim()) {
    ElMessage.warning(t('file.contentRequired'))
    return
  }
  safeSend({ type: 'CLIP_SHARE', content: clipContent.value.trim() })
  showClipDialog.value = false
  ElMessage.success(t('file.clipboardSent'))
}

async function copyClip(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('file.clipboardCopied'))
  } catch {
    // HTTP 环境下 Clipboard API 不可用，回退到 execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      ElMessage.success(t('file.clipboardCopied'))
    } catch {
      ElMessage.warning(t('file.clipboardManualCopy'))
    }
    document.body.removeChild(ta)
  }
  showClipReceive.value = false
}

async function loadQrCode() {
  qrLoading.value = true
  try {
    // 添加超时控制，避免长时间等待
    const result = await Promise.race([
      getQrCode(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('二维码生成超时')), 10000))
    ])
    qrData.value = result
  } catch (err) {
    ElMessage.error(err.message || '二维码生成失败')
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
    ElMessage.warning(t('file.linkNotAvailable'))
    return
  }
  const url = location.origin + row.path
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(t('file.linkCopied'))
  } catch {
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    try {
      document.execCommand('copy')
      ElMessage.success(t('file.linkCopied'))
    } catch {
      ElMessage.info(`链接：${url}`)
    }
    document.body.removeChild(input)
  }
}

// ========== 新功能 ==========

// 通知系统
let notifSeq = 0
function addNotification(type, title, message = '') {
  const id = Date.now() + (++notifSeq)
  notifications.value.push({ id, type, title, message })
  setTimeout(() => {
    dismissNotification(id)
  }, NOTIFICATION_DURATION)
}

function dismissNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 引导功能
function initGuide() {
  if (!isGuideShown.value) {
    setTimeout(() => {
      showGuide()
    }, 1000)
  }
}

function handleGuideNext(step) {
  currentGuideStep.value = step
}

function handleGuideSkip() {
  skipGuide()
}

function handleGuideComplete() {
  completeGuide()
  addNotification('success', t('guide.title'), t('guide.complete'))
}

// 语言切换
function handleLanguageChange(lang) {
  setLanguage(lang)
  currentLanguage.value = lang
  addNotification('success', t('settings.language'), lang === 'zh-CN' ? t('settings.switchedToZh') : t('settings.switchedToEn'))
}

// 延迟检测
let latencyTimer = null
function startLatencyCheck() {
  stopLatencyCheck()
  latencyTimer = setInterval(() => {
    // 发送带时间戳的 PING，等收到 PONG 时再计算往返延迟
    safeSend({ type: 'PING', t: Date.now() })
  }, 5000)
}

function stopLatencyCheck() {
  if (latencyTimer) {
    clearInterval(latencyTimer)
    latencyTimer = null
  }
}

// 会话备注
function loadSessionNotes() {
  try {
    const stored = localStorage.getItem(SESSION_NOTE_KEY)
    sessionNotes.value = stored ? JSON.parse(stored) : {}
  } catch {
    sessionNotes.value = {}
  }
}

function updateSessionNote({ sessionId, note }) {
  sessionNotes.value[sessionId] = note
  localStorage.setItem(SESSION_NOTE_KEY, JSON.stringify(sessionNotes.value))
}

// 文件版本管理
function loadFileVersions() {
  try {
    const stored = localStorage.getItem(VERSION_HISTORY_KEY)
    fileVersions.value = stored ? JSON.parse(stored) : {}
  } catch {
    fileVersions.value = {}
  }
}

function saveFileVersion(fileId, versionData) {
  if (!fileVersions.value[fileId]) {
    fileVersions.value[fileId] = []
  }
  fileVersions.value[fileId].unshift(versionData)
  if (fileVersions.value[fileId].length > MAX_VERSIONS_PER_FILE) {
    fileVersions.value[fileId] = fileVersions.value[fileId].slice(0, MAX_VERSIONS_PER_FILE)
  }
  localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(fileVersions.value))
}

// ========== Watchers ==========
watch(showQrDialog, visible => {
  if (visible && !qrData.value.dataUrl) loadQrCode()
})

watch(chatOpen, visible => {
  if (visible) {
    unreadCount.value = 0
    nextTick(() => scrollChat())
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

// ========== Lifecycle ==========
onMounted(() => {
  connectSocket()
  syncNotifyState()
  window.addEventListener('paste', onPaste)

  // 初始化新功能
  initGuide()
  loadSessionNotes()
  loadFileVersions()
})

onBeforeUnmount(() => {
  if (isConnected.value) safeSend({ type: 'DISCONNECT', message: `${deviceName.value} 已离开页面` })
  clearTimeout(deviceActionTimer.value)
  clearTimeout(waitTimer.value)
  closeSocket()
  window.removeEventListener('paste', onPaste)
  stopLatencyCheck()
})
</script>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .layout {
    flex-direction: column;
    flex: 1;
  }

  .panel-header {
    padding: 12px 16px;
  }

  .panel-body {
    padding: 16px;
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<style scoped>
/* 局部样式 */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.upload-notifs {
  margin-bottom: 16px;
}

.upload-notif {
  padding: 12px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.notif-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-right {
  margin-left: auto;
}

.sort-btn {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}

.sort-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.sort-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.chat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #f56c6c;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
}

/* ─── 页面底部 ──────────────────────────────────── */
.app-footer {
  flex-shrink: 0;
  margin-top: 16px;
  border-top: 1px solid var(--line);
  background: var(--panel-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  transition: background 0.25s, border-color 0.25s;
}

/* 顶部渐变线 */
.app-footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2563eb, #10b981, #2563eb, transparent);
  background-size: 100% 100%;
  opacity: 0.5;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 20px;
  gap: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.footer-logo-svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.footer-brand strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.2px;
}

.footer-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  background: var(--stat-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--muted);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.2s;
}
.footer-link:hover {
  color: var(--text);
  background: var(--stat-bg);
}
.footer-link svg {
  flex-shrink: 0;
  opacity: 0.6;
}

.footer-copy {
  font-size: 11px;
  color: var(--muted);
  opacity: 0.55;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .footer-inner {
    flex-wrap: wrap;
    justify-content: center;
    padding: 10px 16px;
    gap: 10px;
  }

  .footer-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .footer-copy {
    font-size: 10px;
  }
}
</style>