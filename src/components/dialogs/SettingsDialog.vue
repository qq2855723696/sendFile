<template>
  <el-dialog
    v-model="visible"
    :title="t('settings.title')"
    width="500px"
    :close-on-click-modal="true"
    class="settings-dialog"
  >
    <el-tabs v-model="activeTab">
      <!-- 通用设置 -->
      <el-tab-pane :label="t('settings.general')" name="general">
        <div class="setting-item">
          <span>{{ t('settings.language') }}</span>
          <el-select v-model="languageModel" size="small" style="width: 150px" @change="handleLanguageChange">
            <el-option
              v-for="lang in supportedLanguages"
              :key="lang.code"
              :label="lang.name"
              :value="lang.code"
            />
          </el-select>
        </div>

        <div class="setting-item">
          <span>{{ t('settings.darkMode') }}</span>
          <el-switch v-model="darkModeModel" @change="handleDarkModeChange" />
        </div>

        <div class="setting-item">
          <span>{{ t('settings.desktopNotifications') }}</span>
          <el-switch
            v-model="notifyEnabledModel"
            :disabled="notifyPermission === 'denied'"
            @change="handleNotifyChange"
          />
        </div>

        <div v-if="notifyPermission === 'denied'" class="setting-hint">
          {{ t('notifications.permissionDenied') }}
        </div>
      </el-tab-pane>

      <!-- 快捷键 -->
      <el-tab-pane :label="t('settings.shortcuts')" name="shortcuts">
        <div class="shortcuts-list">
          <div v-for="(shortcut, key) in shortcuts" :key="key" class="shortcut-item">
            <span class="shortcut-name">{{ t(`settings.shortcut${key}`) }}</span>
            <kbd class="shortcut-key">{{ shortcut }}</kbd>
          </div>
        </div>
      </el-tab-pane>

      <!-- 传输历史 -->
      <el-tab-pane :label="t('settings.transferHistory')" name="history">
        <div class="history-info">
          <p>{{ t('settings.clearHistory') }}</p>
          <el-button type="danger" size="small" @click="handleClearHistory">
            {{ t('settings.clearHistory') }}
          </el-button>
        </div>
      </el-tab-pane>

      <!-- 关于 -->
      <el-tab-pane :label="t('settings.about')" name="about">
        <div class="about-info">
          <div class="about-logo">📁</div>
          <h3>SendFile</h3>
          <p>{{ t('settings.version') }}: 2.0.0</p>
          <p>局域网文件快传工具</p>
          <p>© 2026 SendFile. MIT License</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { KEYBOARD_SHORTCUTS } from '@/constants'
import { useLanguage } from '@/composables/useLanguage'

const props = defineProps({
  visible: Boolean,
  notifyEnabled: Boolean,
  darkMode: Boolean,
  language: String,
  notifyPermission: String,
  transferHistory: Array
})

const emit = defineEmits([
  'update:visible',
  'update:notifyEnabled',
  'update:darkMode',
  'update:language',
  'request-notify',
  'disable-notify',
  'toggle-dark',
  'change-language',
  'clear-history'
])

const { t, setLanguage, getSupportedLanguages } = useLanguage()

const activeTab = ref('general')
const languageModel = ref(props.language)
const darkModeModel = ref(props.darkMode)
const notifyEnabledModel = ref(props.notifyEnabled)
const supportedLanguages = ref(getSupportedLanguages())

const shortcuts = {
  Upload: KEYBOARD_SHORTCUTS.UPLOAD.toUpperCase().replace('+', ' + '),
  Clipboard: KEYBOARD_SHORTCUTS.CLIPBOARD.toUpperCase().replace('+', ' + '),
  Search: KEYBOARD_SHORTCUTS.SEARCH.toUpperCase().replace('+', ' + '),
  Close: 'Esc',
  SelectAll: KEYBOARD_SHORTCUTS.SELECT_ALL.toUpperCase().replace('+', ' + ')
}

watch(() => props.visible, (val) => {
  if (val) {
    activeTab.value = 'general'
  }
})

function handleLanguageChange(lang) {
  setLanguage(lang)
  emit('update:language', lang)
  emit('change-language', lang)
}

function handleDarkModeChange(val) {
  emit('update:darkMode', val)
  emit('toggle-dark')
}

function handleNotifyChange(val) {
  if (val) {
    emit('request-notify')
  } else {
    emit('disable-notify')
  }
  emit('update:notifyEnabled', val)
}

async function handleClearHistory() {
  try {
    await ElMessageBox.confirm(
      t('settings.clearHistoryConfirm'),
      t('common.warning'),
      { type: 'warning' }
    )
    emit('clear-history')
  } catch {
    // 取消
  }
}

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})
</script>

<style scoped>
.settings-dialog {
  max-width: 90vw;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-hint {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 8px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.shortcut-name {
  color: #606266;
}

.shortcut-key {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: monospace;
  font-size: 12px;
}

.history-info {
  text-align: center;
  padding: 20px;
}

.about-info {
  text-align: center;
  padding: 20px;
}

.about-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.about-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.about-info p {
  margin: 4px 0;
  color: #909399;
  font-size: 13px;
}
</style>
