<template>
  <el-dialog v-model="visible" title="输入 PIN" width="400px">
    <form @submit.prevent="$emit('submit')">
      <p>设备「{{ targetDeviceName }}」需要 PIN 码才能连接。</p>
      <el-input v-model="inputPinModel" placeholder="请输入 PIN" show-password autofocus />
    </form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="$emit('submit')">确认连接</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })
const inputPinModel = defineModel('inputPin', { type: String, default: '' })

defineProps({
  targetDeviceName: String
})

defineEmits(['submit'])
</script>

