<template>
  <div class="mobile-only">
    <button class="mobile-fab" :style="localOnline ? 'background:var(--success)' : ''" @click="openModel = true">
      <span class="status-dot" :class="{ online: localOnline }" style="flex-shrink:0"></span>
      {{ localOnline ? deviceNameModel : t('settings.title') }}
      <span style="font-size:12px;opacity:.8">⚙️</span>
    </button>

    <el-drawer v-model="openModel" direction="btt" :with-header="true" :title="t('settings.title')" size="auto" class="mobile-settings-drawer">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <span style="font-weight:700;font-size:16px">{{ t('settings.title') }}</span>
          <el-tag :type="wsReady ? 'success' : 'info'" effect="plain" size="small">{{ wsReady ? t('device.connected') : t('device.connecting') }}</el-tag>
        </div>
      </template>
      <form @submit.prevent="$emit('online')">
        <div class="field">
          <label>{{ t('device.name') }}</label>
          <el-input v-model="deviceNameModel" :placeholder="t('device.namePlaceholder')" clearable :disabled="localOnline" />
        </div>
        <div class="field">
          <label>{{ t('device.pinCode') }}</label>
          <el-input v-model="pinCodeModel" :placeholder="t('device.pinPlaceholder')" maxlength="12" show-password :disabled="localOnline" />
        </div>
        <div class="field">
          <label>{{ t('device.status') }}</label>
          <el-select v-model="deviceStatusModel" style="width:100%" :disabled="!localOnline" @change="$emit('status-change')">
            <el-option :label="t('device.onlineStatus')" value="online" />
            <el-option :label="t('device.busyStatus')" value="busy" />
            <el-option :label="t('device.awayStatus')" value="away" />
          </el-select>
        </div>
        <div class="actions">
          <el-button v-if="!localOnline" type="primary" native-type="submit" :loading="loading" style="flex:1">
            {{ t('device.online') }}
          </el-button>
          <el-button v-else type="danger" :loading="loading" style="flex:1" @click="$emit('offline')">
            {{ t('device.offline') }}
          </el-button>
        </div>
      </form>
    </el-drawer>
  </div>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const openModel = defineModel('open', { type: Boolean, default: false })
const deviceNameModel = defineModel('deviceName', { type: String, default: '' })
const pinCodeModel = defineModel('pinCode', { type: String, default: '' })
const deviceStatusModel = defineModel('deviceStatus', { type: String, default: 'online' })

defineProps({ wsReady: Boolean, localOnline: Boolean, loading: Boolean })
defineEmits(['online', 'offline', 'status-change'])
</script>
