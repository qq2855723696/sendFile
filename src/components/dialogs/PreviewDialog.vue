<template>
  <el-dialog v-model="preview.visible" :title="preview.name || t('file.preview')" width="80vw" top="5vh" destroy-on-close>
    <div class="preview-box">
      <img v-if="preview.mode === 'image'" :src="preview.url" class="preview-media" alt="preview">
      <video v-else-if="preview.mode === 'video'" :src="preview.url" class="preview-media" controls></video>
      <audio v-else-if="preview.mode === 'audio'" :src="preview.url" controls style="width:100%"></audio>
      <iframe v-else-if="preview.mode === 'pdf' || preview.mode === 'docx'" :src="preview.url" class="preview-frame"></iframe>
      <pre v-else-if="preview.mode === 'text'" class="preview-text">{{ preview.text }}</pre>
      <div v-else class="empty">{{ t('file.previewUnsupported', '该文件类型暂不支持在线预览') }}</div>
    </div>
    <template #footer>
      <el-button type="success" @click="$emit('download', preview.row)">{{ t('file.download') }}</el-button>
      <el-button @click="preview.visible = false">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

defineProps({ preview: { type: Object, required: true } })
defineEmits(['download'])
</script>
