export const CHUNK_SIZE = 2 * 1024 * 1024
export const CHUNK_CONCURRENCY = 4
export const MAX_FILE_SIZE = 500 * 1024 * 1024
export const MAX_TOTAL_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024
export const LARGE_DOWNLOAD_SIZE = 5 * 1024 * 1024
export const TEXT_PREVIEW_LIMIT = 5 * 1024 * 1024
export const TEXT_PREVIEW_CHARS = 200000

// ========== 新增常量 ==========

// 引导相关
export const GUIDE_SHOWN_KEY = 'sendfile.guideShown'
export const GUIDE_STEPS = [
  { target: 'device-online', title: '上线设备', description: '首先需要上线您的设备，让其他设备可以发现您' },
  { target: 'connect-device', title: '连接设备', description: '点击连接按钮，与其他设备建立会话' },
  { target: 'upload-file', title: '传输文件', description: '进入会话后，可以拖拽或选择文件进行传输' }
]

// 文件版本管理
export const MAX_VERSIONS_PER_FILE = 3
export const VERSION_HISTORY_KEY = 'sendfile.versions'

// 传输队列
export const TRANSACTION_QUEUE_KEY = 'sendfile.queue'
export const MAX_QUEUE_SIZE = 100

// 多语言支持
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US']
export const DEFAULT_LANGUAGE = 'zh-CN'
export const LANGUAGE_KEY = 'sendfile.language'

// 动画
export const ANIMATION_DURATION = 300
export const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

// 缓存
export const CACHE_SIZE_LIMIT = 50 * 1024 * 1024 // 50MB
export const CACHE_KEY = 'sendfile.cache'

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  UPLOAD: 'ctrl+u',
  CLIPBOARD: 'ctrl+shift+c',
  SEARCH: 'ctrl+f',
  CLOSE: 'escape',
  SELECT_ALL: 'ctrl+a',
  NEWLINE: 'enter'
}

// 文件标签颜色
export const TAG_COLORS = {
  work: '#409eff',
  personal: '#67c23a',
  temp: '#e6a23c',
  important: '#f56c6c',
  other: '#909399'
}

// 会话备注
export const SESSION_NOTE_KEY = 'sendfile.sessionNotes'

// 操作日志
export const MAX_LOG_ENTRIES = 500
export const LOG_KEY = 'sendfile.logs'

// 虚拟滚动
export const VIRTUAL_SCROLL_ITEM_HEIGHT = 60
export const VIRTUAL_SCROLL_OVERSCAN = 10

// 通知
export const NOTIFICATION_DURATION = 3000
export const NOTIFICATION_POSITION = 'top-right'

// 断线重连
export const RECONNECT_INTERVAL = 1200
export const MAX_RECONNECT_ATTEMPTS = 10

// 文件类型图标
export const FILE_TYPE_ICONS = {
  image: 'Picture',
  video: 'VideoCamera',
  audio: 'Headset',
  document: 'Document',
  archive: 'Folder',
  code: 'DocumentCode',
  other: 'Document'
}
