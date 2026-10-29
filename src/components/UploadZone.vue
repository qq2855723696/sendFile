<template>
  <div
    class="dropzone"
    :class="{ active: dragActive }"
    @click="$emit('choose-files')"
    @dragenter.prevent="$emit('drag-enter')"
    @dragover.prevent="$emit('drag-over')"
    @dragleave.prevent="$emit('drag-leave')"
    @drop.prevent="$emit('drop-files', $event)"
  >
    <div class="drop-title">{{ t('file.dragUpload') }}</div>
    <div class="drop-copy">
      {{ t('file.pasteUpload') }} · {{ t('file.dropHint', { size: formatSize(MAX_FILE_SIZE) }) }}
    </div>
    <el-progress v-if="uploading" :percentage="uploadProgress" :stroke-width="10" style="margin-top:12px" />
    <div v-if="uploading && uploadSpeedText" class="upload-speed">⚡ {{ uploadSpeedText }}</div>
  </div>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
import { MAX_FILE_SIZE } from '@/constants'
import { formatSize } from '@/utils/format'
const { t } = useLanguage()

defineProps({
  dragActive: Boolean,
  uploading: Boolean,
  uploadProgress: Number,
  uploadSpeedText: String
})

defineEmits(['choose-files', 'drag-enter', 'drag-over', 'drag-leave', 'drop-files'])
</script>
