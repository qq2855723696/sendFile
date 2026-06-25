<template>
  <el-dialog v-model="visible" :title="t('device.pinCode')" width="400px">
    <form @submit.prevent="$emit('submit')">
      <p>{{ t('device.pinRequired', { name: targetDeviceName }) }}</p>
      <el-input v-model="inputPinModel" :placeholder="t('device.pinPlaceholder')" show-password autofocus />
    </form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('submit')">{{ t('device.connect') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
const inputPinModel = defineModel('inputPin', { type: String, default: '' })
defineProps({ targetDeviceName: String })
defineEmits(['submit'])
</script>
