<template>
  <el-dialog v-model="visible" title="连接请求" width="400px" :close-on-click-modal="false">
    <p>设备「{{ incomingRequest.fromName }}」请求与你建立文件传输会话。</p>
    <template #footer>
      <el-button @click="$emit('reply', false)">拒绝</el-button>
      <el-button type="primary" @click="$emit('reply', true)">同意</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  incomingRequest: { type: Object, default: () => ({}) }
})

defineEmits(['reply'])
</script>

