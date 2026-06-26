<template>
  <aside class="panel" :class="{ 'panel-mobile': isMobile }">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('settings.title') }}</h2>
      <el-tag :type="wsReady ? 'success' : 'info'" effect="plain">{{ wsReady ? t('device.connected') : t('device.connecting') }}</el-tag>
    </div>
    <div class="panel-body">
      <form @submit.prevent="$emit('online')">
        <div class="field">
          <label>{{ t('device.name') }}</label>
          <el-input
            v-model="deviceNameModel"
            :placeholder="t('device.namePlaceholder')"
            clearable
            :disabled="localOnline"
            data-guide="device-name"
          />
        </div>
        <div class="field">
          <label>{{ t('device.pinCode') }}</label>
          <el-input
            v-model="pinCodeModel"
            :placeholder="t('device.pinPlaceholder')"
            maxlength="12"
            show-password
            :disabled="localOnline"
          />
        </div>
        <div class="field">
          <label>{{ t('device.status') }}</label>
          <el-select
            v-model="deviceStatusModel"
            style="width:100%"
            :disabled="!localOnline"
            @change="$emit('status-change')"
          >
            <el-option :label="t('device.onlineStatus')" value="online" />
            <el-option :label="t('device.busyStatus')" value="busy" />
            <el-option :label="t('device.awayStatus')" value="away" />
          </el-select>
        </div>
        <div class="actions">
          <el-button
            v-if="!localOnline"
            type="primary"
            native-type="submit"
            :loading="loading"
            style="flex:1"
            data-guide="device-online"
          >
            {{ t('device.online') }}
          </el-button>
          <el-button
            v-else
            type="danger"
            :loading="loading"
            style="flex:1"
            @click="$emit('offline')"
          >
            {{ t('device.offline') }}
          </el-button>
        </div>
      </form>

      <!-- 本机 IP -->
      <div class="ip-card" :class="{ 'ip-card--online': localOnline }">
        <div class="ip-card__label">{{ t('settings.localIp') }}</div>
        <div class="ip-card__value">
          <span v-if="localOnline && props.myRealIp" class="ip-card__addr">{{ props.myRealIp }}</span>
          <span v-else class="ip-card__addr ip-card__addr--na">{{ localOnline ? t('common.loading') : t('device.pleaseOnline') }}</span>
          <el-button
            size="small"
            type="primary"
            plain
            :disabled="!localOnline || !props.myRealIp"
            :icon="CopyDocument"
            class="ip-card__btn"
            @click="copyMyIp"
          >
            {{ t('common.copy') }}
          </el-button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { useLanguage } from '@/composables/useLanguage'

const { t } = useLanguage()

const deviceNameModel = defineModel('deviceName', { type: String, default: '' })
const pinCodeModel = defineModel('pinCode', { type: String, default: '' })
const deviceStatusModel = defineModel('deviceStatus', { type: String, default: 'online' })

const props = defineProps({
  wsReady: Boolean,
  localOnline: Boolean,
  loading: Boolean,
  myRealIp: { type: String, default: '' }
})

defineEmits(['online', 'offline', 'status-change'])

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

async function copyMyIp() {
  const ip = props.myRealIp || localStorage.getItem('sendfile.myIp') || ''
  if (!ip) {
    ElMessage.warning(t('device.pleaseOnline'))
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(ip)
      ElMessage.success(t('file.linkCopied'))
      return
    }
  } catch { /* fallback */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = ip
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success(t('file.linkCopied'))
  } catch {
    ElMessage.error(t('errors.unknownError'))
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
</script>

<style scoped>
.panel {
  width: 280px;
  background: var(--panel);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
}
.panel-mobile { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--line); }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--line); }
.panel-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text); }
.panel-body { flex: 1; padding: 16px; overflow-y: auto; }
.field { margin-bottom: 16px; }
.field label { display: block; margin-bottom: 6px; font-size: 13px; color: var(--muted); font-weight: 500; }
.actions { margin-top: 20px; }
.ip-card { margin-top: 24px; padding: 14px 16px; background: var(--stat-bg); border: 1px solid var(--line); border-radius: 8px; transition: border-color 0.3s, background 0.3s; }
.ip-card--online { background: rgba(37, 99, 235, 0.06); border-color: rgba(37, 99, 235, 0.25); }
[data-theme="dark"] .ip-card--online { background: rgba(59, 130, 246, 0.12); border-color: rgba(59, 130, 246, 0.30); }
.ip-card__label { font-size: 12px; color: var(--muted); margin-bottom: 8px; font-weight: 500; }
.ip-card__value { display: flex; align-items: center; gap: 10px; }
.ip-card__addr { flex: 1; font-size: 15px; font-weight: 600; color: var(--text); font-family: 'SF Mono', 'Fira Code', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ip-card__addr--na { font-weight: 400; font-size: 13px; color: var(--muted); font-family: inherit; }
.ip-card__btn { flex-shrink: 0; }
@media (max-width: 768px) {
  .panel { width: 100%; max-height: 200px; }
  .panel-body { padding: 12px; }
  .field { margin-bottom: 12px; }
}
</style>
