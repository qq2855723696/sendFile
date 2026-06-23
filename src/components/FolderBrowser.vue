<template>
  <div class="folder-path">
    <div class="path-text">
      {{ currentFolderEntry?.name }}{{ folderBrowse?.subPath ? ` / ${folderBrowse.subPath}` : '' }}
    </div>
    <div class="actions">
      <el-button @click="$emit('up')">返回上级</el-button>
      <el-button type="success" @click="$emit('download-zip', currentFolderEntry)">下载 ZIP</el-button>
    </div>
  </div>

  <el-table :data="rows" border stripe>
    <el-table-column label="名称" min-width="240">
      <template #default="{ row }">
        <el-button v-if="row.type === 'folder'" link type="primary" @click="$emit('enter', row.name)">
          [文件夹] {{ row.name }}
        </el-button>
        <span v-else>{{ row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="类型" width="120" align="center">
      <template #default="{ row }">{{ row.type === 'folder' ? '目录' : fileKindText(row) }}</template>
    </el-table-column>
    <el-table-column label="大小" width="100" align="center">
      <template #default="{ row }">{{ row.type === 'folder' ? '-' : fileSizeText(row) }}</template>
    </el-table-column>
    <el-table-column label="操作" width="150" align="center">
      <template #default="{ row }">
        <span v-if="row.type === 'file'" class="row-actions">
          <el-button type="primary" size="small" @click="$emit('preview', row)">预览</el-button>
          <el-button type="success" size="small" @click="$emit('download', row)">下载</el-button>
        </span>
        <span v-else>目录</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { fileKindText, fileSizeText } from '@/utils/format'

defineProps({
  folderBrowse: { type: Object, default: null },
  currentFolderEntry: { type: Object, default: null },
  rows: { type: Array, default: () => [] }
})

defineEmits(['up', 'download-zip', 'enter', 'preview', 'download'])
</script>

