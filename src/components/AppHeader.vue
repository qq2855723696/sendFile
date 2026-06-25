<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Logo -->
      <div class="logo">
        <svg class="logo-svg" viewBox="0 0 40 40" width="36" height="36">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="32" height="28" rx="5" fill="url(#logoGrad)"/>
          <rect x="10" y="12" width="20" height="3" rx="1.5" fill="#fff" opacity="0.9"/>
          <rect x="10" y="18" width="15" height="2.5" rx="1.25" fill="#fff" opacity="0.55"/>
          <rect x="10" y="23" width="12" height="2.5" rx="1.25" fill="#fff" opacity="0.35"/>
          <circle cx="30" cy="30" r="8" fill="#10b981"/>
          <path d="M26 30l3 3 5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="logo-text">SendFile</span>
      </div>

      <!-- 设备名称标签 -->
      <el-tag v-if="deviceName" size="small" round type="info" class="device-tag">
        <span class="device-tag-dot"></span>
        {{ deviceName }}
      </el-tag>
    </div>

    <div class="header-center">
      <!-- 连接状态指示器 -->
      <el-tag size="small" round :type="statusTagType" class="connection-badge">
        <span class="conn-dot" :class="statusClass"></span>
        {{ statusText }}
        <span v-if="networkLatency > 0" class="conn-latency">{{ networkLatency }}ms</span>
      </el-tag>
    </div>

    <div class="header-right">
      <!-- 语言切换 -->
      <el-dropdown trigger="click" @command="$emit('change-language', $event)" popper-class="lang-dropdown">
        <el-button size="small" text class="header-btn">
          <el-icon><img :src="currentLanguage === 'zh-CN' ? '' : ''" style="display:none" /></el-icon>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <span class="btn-label">{{ currentLanguage === 'zh-CN' ? '中' : 'EN' }}</span>
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

      <span class="header-sep"></span>

      <!-- 扫码 -->
      <el-button size="small" text :disabled="!localOnline" class="header-btn" title="扫码连接" @click="$emit('open-qr')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="17" y="17" width="0.5" height="0.5"/>
          <rect x="20" y="14" width="4" height="4" rx="1"/>
          <path d="M14 14h3v3"/>
          <path d="M21 21v.01"/>
        </svg>
        <span class="btn-label">扫码</span>
      </el-button>

      <!-- 历史 -->
      <el-button size="small" text class="header-btn" title="传输历史" @click="$emit('open-history')">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span class="btn-label">历史</span>
      </el-button>

      <span class="header-sep"></span>

      <!-- 通知开关 -->
      <el-button
        size="small"
        :text="!(notifyPermission === 'granted' && notifyEnabled)"
        :type="notifyPermission === 'granted' && notifyEnabled ? 'primary' : ''"
        class="header-btn icon-only"
        :title="notifyPermission === 'granted' && notifyEnabled ? '通知已开启' : notifyPermission === 'denied' ? '通知已被浏览器阻止' : '开启桌面通知'"
        @click="notifyPermission === 'granted' && notifyEnabled ? $emit('disable-notify') : $emit('request-notify')"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </el-button>

      <!-- 深色模式 -->
      <el-button size="small" text class="header-btn icon-only" :title="darkMode ? '切换亮色模式' : '切换深色模式'" @click="$emit('toggle-dark')">
        <svg v-if="darkMode" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </el-button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useLanguage } from '@/composables/useLanguage'

const { t } = useLanguage()

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

defineEmits([
  'open-qr',
  'open-history',
  'disable-notify',
  'request-notify',
  'toggle-dark',
  'change-language'
])

const statusClass = computed(() => `conn-${props.connectionStatus}`)

const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected': return t('device.connected')
    case 'connecting': return t('device.connecting')
    case 'reconnecting': return t('device.connecting')
    default: return t('device.disconnected')
  }
})

const statusTagType = computed(() => {
  switch (props.connectionStatus) {
    case 'connected': return 'success'
    case 'connecting':
    case 'reconnecting': return 'warning'
    default: return 'info'
  }
})

const statusTooltip = computed(() => {
  if (props.networkLatency > 0) return `延迟 ${props.networkLatency}ms`
  return statusText.value
})
</script>

<style scoped>
/* ─── Header 容器 ─────────────────────────────────────── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  margin-bottom: 16px;
  background: var(--panel-bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100;
  position: relative;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}

/* 底部渐变装饰线 */
.app-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: linear-gradient(90deg, #2563eb, #10b981, #2563eb);
  background-size: 200% 100%;
  border-radius: 0 0 2px 2px;
  opacity: 0;
  transition: opacity 0.35s;
}
.app-header:hover::after {
  opacity: 0.6;
}

/* ─── 左侧 ──────────────────────────────────────────── */
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-svg {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.25));
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #2563eb, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.device-tag {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.device-tag-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-right: 4px;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

/* ─── 中间 ──────────────────────────────────────────── */
.header-center {
  display: flex;
  align-items: center;
}

.connection-badge {
  font-size: 12px;
}

.conn-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  margin-right: 5px;
  transition: background 0.3s, box-shadow 0.3s;
}

.conn-connected {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.conn-connecting,
.conn-reconnecting {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  animation: connPulse 1.2s ease-in-out infinite;
}

.conn-disconnected {
  background: #94a3b8;
}

@keyframes connPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.75); }
}

.conn-latency {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  opacity: 0.65;
  margin-left: 2px;
}

/* ─── 右侧按钮组 ────────────────────────────────────── */
.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.header-sep {
  width: 1px;
  height: 22px;
  background: var(--line);
  margin: 0 4px;
  border-radius: 1px;
}

.header-btn {
  color: var(--muted) !important;
  border: 1px solid transparent !important;
}
.header-btn:hover:not(:disabled) {
  color: var(--text) !important;
  background: var(--stat-bg) !important;
  border-color: var(--line) !important;
}

.header-btn.icon-only {
  width: 34px;
  padding: 0 !important;
  justify-content: center;
}

.btn-label {
  font-weight: 500;
}

/* ─── 响应式 ────────────────────────────────────────── */
@media (max-width: 768px) {
  .app-header {
    height: 48px;
    padding: 0 12px;
    border-radius: 10px;
    margin-bottom: 12px;
  }

  .logo-text {
    font-size: 16px;
  }

  .device-tag {
    display: none;
  }

  .btn-label {
    display: none;
  }

  .header-btn {
    width: 34px !important;
    padding: 0 !important;
    justify-content: center;
  }

  .header-sep {
    margin: 0 2px;
  }

  .conn-latency {
    display: none;
  }

  .header-center {
    flex: 0 1 auto;
  }

  .header-right {
    gap: 0;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 8px;
    height: 44px;
  }

  .logo-svg {
    width: 28px;
    height: 28px;
  }

  .logo-text {
    display: none;
  }

  .header-btn {
    width: 30px !important;
  }

  .header-btn svg {
    width: 15px;
    height: 15px;
  }

  .header-sep {
    height: 18px;
    margin: 0 1px;
  }
}
</style>
