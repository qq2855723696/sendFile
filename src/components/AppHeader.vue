<template>
  <header class="app-header">
    <div>
      <h1 class="title">📡 SendFile</h1>
      <p class="subtitle">局域网文件快传 · 扫码直连 · 断点续传 · 实时聊天</p>
    </div>
    <div class="header-right">
      <el-button size="small" :disabled="!localOnline" @click="$emit('open-qr')">
        📱 扫码连接
      </el-button>
      <el-button size="small" @click="$emit('open-history')">
        🕐 历史记录
      </el-button>
      <el-button
        v-if="notifyPermission === 'granted' && notifyEnabled"
        size="small"
        type="success"
        title="通知已开启，点击关闭"
        @click="$emit('disable-notify')"
      >
        🔔 通知已开
      </el-button>
      <el-button
        v-else
        size="small"
        :title="notifyPermission === 'denied' ? '通知权限被阻止，点击查看解决方案' : '点击开启桌面通知'"
        @click="$emit('request-notify')"
      >
        🔕 开启通知
      </el-button>
      <el-button size="small" @click="$emit('toggle-dark')">
        {{ darkMode ? '☀️ 亮色' : '🌙 深色' }}
      </el-button>
      <div class="status-pill">
        <span class="status-dot" :class="{ online: localOnline }"></span>
        <span>{{ localOnline ? `在线：${deviceName}` : '当前未上线' }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  localOnline: Boolean,
  deviceName: String,
  darkMode: Boolean,
  notifyPermission: String,
  notifyEnabled: Boolean
})

defineEmits(['open-qr', 'open-history', 'disable-notify', 'request-notify', 'toggle-dark'])
</script>

