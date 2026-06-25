<template>
  <el-dialog v-model="visible" :title="t('file.clipboard')" width="480px">
    <el-input v-model="contentModel" type="textarea" :rows="6" :placeholder="t('file.clipboardContent')" />
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('send')">{{ t('file.sendClipboard') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
const contentModel = defineModel('content', { type: String, default: '' })
defineEmits(['send'])
</script>
