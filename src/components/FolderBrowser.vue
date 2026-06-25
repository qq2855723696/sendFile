<template>
  <div class="folder-path">
    <div class="path-text">
      {{ currentFolderEntry?.name }}{{ folderBrowse?.subPath ? ` / ${folderBrowse.subPath}` : '' }}
    </div>
    <div class="actions">
      <el-button @click="$emit('up')">{{ t('file.upFolder') }}</el-button>
      <el-button type="success" @click="$emit('download-zip', currentFolderEntry)">{{ t('file.downloadFolder') }}</el-button>
    </div>
  </div>

  <el-table :data="rows" border stripe>
    <el-table-column :label="t('file.fileName')" min-width="240">
      <template #default="{ row }">
        <el-button v-if="row.type === 'folder'" link type="primary" @click="$emit('enter', row.name)">
          [{{ t('file.folderBrowser') }}] {{ row.name }}
        </el-button>
        <span v-else>{{ row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="t('file.fileType')" width="120" align="center">
      <template #default="{ row }">{{ row.type === 'folder' ? t('file.folderBrowser') : fileKindText(row) }}</template>
    </el-table-column>
    <el-table-column :label="t('file.fileSize')" width="100" align="center">
      <template #default="{ row }">{{ row.type === 'folder' ? '-' : fileSizeText(row) }}</template>
    </el-table-column>
    <el-table-column :label="t('common.more')" width="150" align="center">
      <template #default="{ row }">
        <span v-if="row.type === 'file'" class="row-actions">
          <el-button type="primary" size="small" @click="$emit('preview', row)">{{ t('file.preview') }}</el-button>
          <el-button type="success" size="small" @click="$emit('download', row)">{{ t('file.download') }}</el-button>
        </span>
        <span v-else>{{ t('file.folderBrowser') }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
import { fileKindText, fileSizeText } from '@/utils/format'

const { t } = useLanguage()

defineProps({
  folderBrowse: { type: Object, default: null },
  currentFolderEntry: { type: Object, default: null },
  rows: { type: Array, default: () => [] }
})

defineEmits(['up', 'download-zip', 'enter', 'preview', 'download'])
</script>
