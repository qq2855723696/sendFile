<template>
  <el-dialog v-model="visible" title="📋 剪贴板快传" width="480px">
    <el-input v-model="contentModel" type="textarea" :rows="6" placeholder="粘贴文字、代码或链接…" />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="$emit('send')">发送给所有成员</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })
const contentModel = defineModel('content', { type: String, default: '' })

defineEmits(['send'])
</script>

