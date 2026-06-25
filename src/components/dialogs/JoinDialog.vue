<template>
  <el-dialog v-model="visible" :title="t('session.applyJoin')" width="400px" :close-on-click-modal="false">
    <p>{{ t('session.joinRequestDesc', { name: incomingJoin.requesterName }) }}</p>
    <template #footer>
      <el-button @click="$emit('reply', false)">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('reply', true)">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
defineProps({ incomingJoin: { type: Object, default: () => ({}) } })
defineEmits(['reply'])
</script>
