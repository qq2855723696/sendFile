<template>
  <el-dialog v-model="visible" title="等待确认" width="340px" :close-on-click-modal="false">
    <p>连接请求已发送，正在等待对方确认…</p>
    <template #footer>
      <el-button @click="$emit('cancel')">取消请求</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })

defineEmits(['cancel'])
</script>

