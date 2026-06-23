<template>
  <div class="mobile-only">
    <button class="mobile-fab" :style="localOnline ? 'background:var(--success)' : ''" @click="openModel = true">
      <span class="status-dot" :class="{ online: localOnline }" style="flex-shrink:0"></span>
      {{ localOnline ? deviceNameModel : '本机设置' }}
      <span style="font-size:12px;opacity:.8">⚙️</span>
    </button>

    <el-drawer v-model="openModel" direction="btt" :with-header="true" title="本机设置" size="auto" class="mobile-settings-drawer">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <span style="font-weight:700;font-size:16px">本机设置</span>
          <el-tag :type="wsReady ? 'success' : 'info'" effect="plain" size="small">{{ wsReady ? '已连接' : '连接中' }}</el-tag>
        </div>
      </template>
      <form @submit.prevent="$emit('online')">
        <div class="field">
          <label>设备名称</label>
          <el-input v-model="deviceNameModel" placeholder="例如：我的手机" clearable :disabled="localOnline" />
        </div>
        <div class="field">
          <label>连接 PIN</label>
          <el-input v-model="pinCodeModel" placeholder="留空表示无需 PIN" maxlength="12" show-password :disabled="localOnline" />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select v-model="deviceStatusModel" style="width:100%" :disabled="!localOnline" @change="$emit('status-change')">
            <el-option label="在线" value="online" />
            <el-option label="忙碌" value="busy" />
            <el-option label="离开" value="away" />
          </el-select>
        </div>
        <div class="actions">
          <el-button v-if="!localOnline" type="primary" native-type="submit" :loading="loading" style="flex:1">
            上线设备
          </el-button>
          <el-button v-else type="danger" :loading="loading" style="flex:1" @click="$emit('offline')">
            下线设备
          </el-button>
        </div>
      </form>
    </el-drawer>
  </div>
</template>

<script setup>
const openModel = defineModel('open', { type: Boolean, default: false })
const deviceNameModel = defineModel('deviceName', { type: String, default: '' })
const pinCodeModel = defineModel('pinCode', { type: String, default: '' })
const deviceStatusModel = defineModel('deviceStatus', { type: String, default: 'online' })

defineProps({
  wsReady: Boolean,
  localOnline: Boolean,
  loading: Boolean
})

defineEmits(['online', 'offline', 'status-change'])
</script>

