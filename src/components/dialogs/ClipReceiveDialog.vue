<template>
  <el-dialog v-model="visible" :title="t('file.receiveClipboard')" width="480px">
    <div style="margin-bottom:8px;color:var(--muted);font-size:13px">{{ t('file.uploader') }}：{{ receivedClip.fromName }}</div>
    <pre class="preview-text" style="max-height:300px">{{ receivedClip.content }}</pre>
    <template #footer>
      <el-button type="primary" @click="$emit('copy', receivedClip.content)">{{ t('common.copy') }}</el-button>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
defineProps({ receivedClip: { type: Object, default: () => ({}) } })
defineEmits(['copy'])
</script>
