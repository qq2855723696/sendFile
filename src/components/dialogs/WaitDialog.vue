<template>
  <el-dialog v-model="visible" :title="t('device.waitResponse')" width="340px" :close-on-click-modal="false">
    <p>{{ t('device.waitResponse') }}…</p>
    <template #footer>
      <el-button @click="$emit('cancel')">{{ t('common.cancel') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
defineEmits(['cancel'])
</script>
