<template>
  <el-dialog v-model="visible" title="入群申请" width="400px" :close-on-click-modal="false">
    <p>设备「{{ incomingJoin.requesterName }}」申请加入当前会话。</p>
    <template #footer>
      <el-button @click="$emit('reply', false)">拒绝</el-button>
      <el-button type="primary" @click="$emit('reply', true)">同意</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  incomingJoin: { type: Object, default: () => ({}) }
})

defineEmits(['reply'])
</script>

