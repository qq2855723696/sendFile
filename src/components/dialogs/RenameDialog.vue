<template>
  <el-dialog v-model="visible" :title="t('file.rename')" width="400px">
    <el-input v-model="renameValueModel" :placeholder="t('file.renamePlaceholder')" autofocus @keydown.enter.prevent="$emit('submit')" />
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('submit')">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
const renameValueModel = defineModel('renameValue', { type: String, default: '' })
defineEmits(['submit'])
</script>
