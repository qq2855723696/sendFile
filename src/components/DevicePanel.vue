<template>
  <aside class="panel" :class="{ 'panel-mobile': isMobile }">
    <div class="panel-header">
      <h2 class="panel-title">本机设置</h2>
      <el-tag :type="wsReady ? 'success' : 'info'" effect="plain">{{ wsReady ? '已连接' : '连接中' }}</el-tag>
    </div>
    <div class="panel-body">
      <form @submit.prevent="$emit('online')">
        <div class="field">
          <label>设备名称</label>
          <el-input
            v-model="deviceNameModel"
            placeholder="例如：办公室电脑"
            clearable
            :disabled="localOnline"
            data-guide="device-name"
          />
        </div>
        <div class="field">
          <label>连接 PIN</label>
          <el-input
            v-model="pinCodeModel"
            placeholder="留空表示无需 PIN"
            maxlength="12"
            show-password
            :disabled="localOnline"
          />
        </div>
        <div class="field">
          <label>状态</label>
          <el-select
            v-model="deviceStatusModel"
            style="width:100%"
            :disabled="!localOnline"
            @change="$emit('status-change')"
          >
            <el-option label="在线" value="online" />
            <el-option label="忙碌" value="busy" />
            <el-option label="离开" value="away" />
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
            上线设备
          </el-button>
          <el-button
            v-else
            type="danger"
            :loading="loading"
            style="flex:1"
            @click="$emit('offline')"
          >
            下线设备
          </el-button>
        </div>
      </form>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <el-button size="small" @click="copyMyIp" :disabled="!localOnline">
          📋 复制 IP
        </el-button>
        <el-button size="small" @click="showQr = true" :disabled="!localOnline">
          📱 显示二维码
        </el-button>
      </div>
    </div>

    <!-- 二维码对话框 -->
    <el-dialog v-model="showQr" title="扫码连接" width="300px" align-center>
      <div class="qr-container">
        <img v-if="qrData.dataUrl" :src="qrData.dataUrl" alt="QR Code" class="qr-image" />
        <p v-else>加载中...</p>
        <p class="qr-url">{{ qrData.url }}</p>
      </div>
    </el-dialog>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getQrCode } from '@/api/session'

const deviceNameModel = defineModel('deviceName', { type: String, default: '' })
const pinCodeModel = defineModel('pinCode', { type: String, default: '' })
const deviceStatusModel = defineModel('deviceStatus', { type: String, default: 'online' })

const props = defineProps({
  wsReady: Boolean,
  localOnline: Boolean,
  loading: Boolean,
  connectionStatus: {
    type: String,
    default: 'disconnected'
  },
  networkLatency: {
    type: Number,
    default: 0
  }
})

defineEmits(['online', 'offline', 'status-change'])

const isMobile = ref(false)
const showQr = ref(false)
const qrData = ref({})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

async function copyMyIp() {
  try {
    const ip = localStorage.getItem('sendfile.myIp') || ''
    if (ip) {
      await navigator.clipboard.writeText(ip)
      ElMessage.success('IP 已复制')
    } else {
      ElMessage.warning('请先上线设备')
    }
  } catch {
    ElMessage.error('复制失败')
  }
}

async function loadQrCode() {
  try {
    qrData.value = await getQrCode()
  } catch {
    ElMessage.error('二维码加载失败')
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
  background: #fff;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.panel-mobile {
  width: 100%;
  height: auto;
  border-right: none;
  border-bottom: 1px solid #ebeef5;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.actions {
  margin-top: 20px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.quick-actions .el-button {
  flex: 1;
}

.qr-container {
  text-align: center;
  padding: 20px;
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.qr-url {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
  word-break: break-all;
}

/* 响应式 */
@media (max-width: 768px) {
  .panel {
    width: 100%;
    max-height: 200px;
  }

  .panel-body {
    padding: 12px;
  }

  .field {
    margin-bottom: 12px;
  }
}
</style>
