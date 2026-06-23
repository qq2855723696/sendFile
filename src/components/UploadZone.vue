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
    <div class="drop-title">拖拽文件到这里上传</div>
    <div class="drop-copy">
      支持多文件、文件夹 · 断点续传 · 最大 500MB/个 &nbsp;·&nbsp; <strong>Ctrl+V</strong>
      粘贴上传截图
    </div>
    <el-progress v-if="uploading" :percentage="uploadProgress" :stroke-width="10" style="margin-top:12px" />
    <div v-if="uploading && uploadSpeedText" class="upload-speed">⚡ {{ uploadSpeedText }}</div>
  </div>
</template>

<script setup>
defineProps({
  dragActive: Boolean,
  uploading: Boolean,
  uploadProgress: Number,
  uploadSpeedText: String
})

defineEmits(['choose-files', 'drag-enter', 'drag-over', 'drag-leave', 'drop-files'])
</script>

