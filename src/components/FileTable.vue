<template>
  <el-table
    ref="fileTable"
    :data="pagedFileList"
    border
    stripe
    :max-height="maxHeight"
    :row-class-name="({ rowIndex }) => rowIndex === dragOverIdx ? 'drag-row-over' : ''"
    @selection-change="$emit('selection-change', $event)"
  >
    <el-table-column label="" width="32" align="center">
      <template #default="{ $index }">
        <span
          class="drag-handle"
          draggable="true"
          title="拖拽调整顺序"
          @dragstart.stop="$emit('drag-start', $index)"
          @dragenter.prevent.stop="$emit('drag-enter-row', $index)"
          @dragover.prevent.stop
          @dragleave.stop="$emit('drag-leave-row')"
          @drop.prevent.stop="$emit('drag-drop', $index)"
        >⠇</span>
      </template>
    </el-table-column>
    <el-table-column type="selection" width="46" />
    <el-table-column label="" width="52" align="center">
      <template #default="{ row }">
        <el-image
          v-if="isImageFile(row)"
          :src="row.path"
          class="file-thumb-img"
          fit="cover"
          :preview-src-list="imagePreviewList"
          :initial-index="imagePreviewList.indexOf(row.path)"
          preview-teleported
          :alt="row.name"
          loading="lazy"
        />
        <div v-else class="thumb-placeholder">{{ row.kind === 'folder' ? '📁' : fileIcon(row) }}</div>
      </template>
    </el-table-column>
    <el-table-column :label="t('file.fileName')" min-width="200">
      <template #default="{ row }">
        <el-button v-if="row.kind === 'folder'" link type="primary" @click="$emit('open-folder', row)">
          [{{ t('file.folderBrowser') }}] {{ row.name }}
        </el-button>
        <span v-else style="cursor:pointer" @click="$emit('preview', row)">{{ row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('file.fileType')" width="90" align="center">
      <template #default="{ row }">{{ row.kind === 'folder' ? t('file.folderBrowser') : fileKindText(row) }}</template>
    </el-table-column>
    <el-table-column :label="t('file.fileSize')" width="100" align="center">
      <template #default="{ row }">{{ row.kind === 'folder' ? `${(row.items || []).length} ${t('session.memberCount')}` : fileSizeText(row) }}</template>
    </el-table-column>
    <el-table-column :label="t('file.uploader')" prop="uploaderName" width="120" />
    <el-table-column :label="t('file.uploadTime')" prop="time" width="165" />
    <el-table-column :label="t('common.more')" width="280" fixed="right" align="center">
      <template #default="{ row }">
        <div class="row-actions">
          <template v-if="row.kind === 'folder'">
            <el-button type="primary" size="small" @click="$emit('open-folder', row)">{{ t('file.preview') }}</el-button>
            <el-button type="success" size="small" @click="$emit('download-folder-zip', row)">ZIP</el-button>
          </template>
          <template v-else>
            <el-button type="primary" size="small" @click="$emit('preview', row)">{{ t('file.preview') }}</el-button>
            <el-button type="success" size="small" @click="$emit('download', row)">{{ t('file.download') }}</el-button>
          </template>
          <el-button size="small" :icon="Link" title="复制下载链接" @click="$emit('copy-link', row)" />
          <el-button v-if="row.ip === myRealIp" type="warning" size="small" @click="$emit('rename', row)">{{ t('file.rename') }}</el-button>
          <el-button v-if="row.ip === myRealIp" type="danger" size="small" @click="$emit('delete', row)">{{ t('file.delete') }}</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { Link } from '@element-plus/icons-vue'
import { useLanguage } from '@/composables/useLanguage'
import { fileIcon, fileKindText, fileSizeText, isImageFile } from '@/utils/format'

const { t } = useLanguage()

defineProps({
  pagedFileList: { type: Array, default: () => [] },
  imagePreviewList: { type: Array, default: () => [] },
  myRealIp: String,
  dragOverIdx: Number,
  maxHeight: { type: [String, Number], default: undefined }
})

defineEmits([
  'selection-change',
  'drag-start',
  'drag-enter-row',
  'drag-leave-row',
  'drag-drop',
  'open-folder',
  'download-folder-zip',
  'preview',
  'download',
  'copy-link',
  'rename',
  'delete'
])
</script>
