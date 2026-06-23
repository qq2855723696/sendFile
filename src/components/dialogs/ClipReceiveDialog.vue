<template>
  <el-dialog v-model="visible" title="📋 收到剪贴板内容" width="480px">
    <div style="margin-bottom:8px;color:var(--muted);font-size:13px">来自：{{ receivedClip.fromName }}</div>
    <pre class="preview-text" style="max-height:300px">{{ receivedClip.content }}</pre>
    <template #footer>
      <el-button type="primary" @click="$emit('copy', receivedClip.content)">复制内容</el-button>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  receivedClip: { type: Object, default: () => ({}) }
})

defineEmits(['copy'])
</script>

