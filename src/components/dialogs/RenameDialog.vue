<template>
  <el-dialog v-model="visible" title="✏️ 重命名文件" width="400px">
    <el-input v-model="renameValueModel" placeholder="请输入新文件名" autofocus @keydown.enter.prevent="$emit('submit')" />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })
const renameValueModel = defineModel('renameValue', { type: String, default: '' })

defineEmits(['submit'])
</script>

