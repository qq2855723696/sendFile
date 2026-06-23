<template>
  <aside class="panel">
    <div class="panel-header">
      <h2 class="panel-title">本机设置</h2>
      <el-tag :type="wsReady ? 'success' : 'info'" effect="plain">{{ wsReady ? '已连接' : '连接中' }}</el-tag>
    </div>
    <div class="panel-body">
      <form @submit.prevent="$emit('online')">
        <div class="field">
          <label>设备名称</label>
          <el-input v-model="deviceNameModel" placeholder="例如：办公室电脑" clearable :disabled="localOnline" />
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
    </div>
  </aside>
</template>

<script setup>
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

