<template>
  <header class="app-header" :class="{ 'dark': darkMode }">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">📁</span>
        <span class="logo-text">SendFile</span>
      </div>
      <span class="device-name">{{ deviceName || '未设置' }}</span>
    </div>

    <div class="header-center">
      <!-- 连接状态指示器 -->
      <div class="connection-status" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
        <span v-if="networkLatency > 0" class="latency">{{ networkLatency }}ms</span>
      </div>
    </div>

    <div class="header-right">
      <!-- 语言切换 -->
      <el-dropdown trigger="click" @command="handleLanguageChange">
        <el-button size="small" circle>
          <span class="lang-icon">{{ currentLanguage === 'zh-CN' ? '🇨🇳' : '🇺🇸' }}</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="lang in supportedLanguages"
              :key="lang.code"
              :command="lang.code"
              :disabled="currentLanguage === lang.code"
            >
              {{ lang.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 扫码 -->
      <el-button size="small" :disabled="!localOnline" @click="$emit('open-qr')">
        <span class="btn-icon">📱</span>
        <span class="btn-text">扫码</span>
      </el-button>

      <!-- 历史 -->
      <el-button size="small" @click="$emit('open-history')">
        <span class="btn-icon">🕐</span>
        <span class="btn-text">历史</span>
      </el-button>

      <!-- 设置 -->
      <el-button size="small" @click="$emit('open-settings')">
        <span class="btn-icon">⚙️</span>
        <span class="btn-text">设置</span>
      </el-button>

      <!-- 通知 -->
      <el-button
        v-if="notifyPermission === 'granted' && notifyEnabled"
        size="small"
        type="success"
        title="通知已开启，点击关闭"
        @click="$emit('disable-notify')"
      >
        🔔
      </el-button>
      <el-button
        v-else
        size="small"
        :title="notifyPermission === 'denied' ? '通知权限被阻止' : '点击开启桌面通知'"
        @click="$emit('request-notify')"
      >
        🔕
      </el-button>

      <!-- 深色模式 -->
      <el-button size="small" @click="$emit('toggle-dark')">
        {{ darkMode ? '☀️' : '🌙' }}
      </el-button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  localOnline: Boolean,
  deviceName: String,
  darkMode: Boolean,
  notifyPermission: String,
  notifyEnabled: Boolean,
  currentLanguage: String,
  supportedLanguages: Array,
  connectionStatus: {
    type: String,
    default: 'disconnected'
  },
  networkLatency: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'open-qr',
  'open-history',
  'open-settings',
  'disable-notify',
  'request-notify',
  'toggle-dark',
  'change-language'
])

const statusClass = computed(() => `status-${props.connectionStatus}`)

const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中...'
    case 'reconnecting':
      return '重连中...'
    default:
      return '未连接'
  }
})

function handleLanguageChange(lang) {
  emit('change-language', lang)
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.app-header.dark {
  background: #1d1e1f;
  border-bottom-color: #363637;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 18px;
  color: #303133;
}

.dark .logo {
  color: #e0e0e0;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.device-name {
  font-size: 13px;
  color: #909399;
  padding: 4px 10px;
  background: #f5f7fa;
  border-radius: 12px;
}

.dark .device-name {
  background: #2d2d2d;
  color: #a0a0a0;
}

.header-center {
  display: flex;
  align-items: center;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  background: #f5f7fa;
}

.dark .connection-status {
  background: #2d2d2d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
}

.status-connected .status-dot {
  background: #67c23a;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
}

.status-connecting .status-dot,
.status-reconnecting .status-dot {
  background: #e6a23c;
  animation: pulse 1s infinite;
}

.status-disconnected .status-dot {
  background: #909399;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  color: #606266;
}

.dark .status-text {
  color: #a0a0a0;
}

.latency {
  color: #909399;
  font-size: 11px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-icon {
  font-size: 16px;
}

.btn-icon {
  margin-right: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .app-header {
    height: 50px;
    padding: 0 12px;
  }

  .logo-text,
  .device-name,
  .btn-text {
    display: none;
  }

  .header-right {
    gap: 4px;
  }

  .connection-status {
    padding: 4px 8px;
  }

  .latency {
    display: none;
  }
}
</style>
