<template>
  <template v-if="isConnected">
    <div class="panel-header">
      <h2 class="panel-title">
        文件仓库 <span style="font-size:13px;font-weight:400;color:var(--muted)">#{{ currentSessionId }}</span>
      </h2>
      <div class="actions">
        <el-button size="small" @click="$emit('open-clip')">📋 剪贴板</el-button>
        <el-button size="small" :type="chatOpen ? 'primary' : ''" @click="$emit('toggle-chat')">
          💬 聊天<span v-if="unreadCount" class="chat-badge">{{ unreadCount }}</span>
        </el-button>
        <el-button size="small" type="danger" plain @click="$emit('leave')">离开</el-button>
      </div>
    </div>
    <div class="panel-body">
      <div class="member-row">
        <span>成员：</span>
        <el-tag v-for="member in currentSessionMembers" :key="member.ip" :type="statusType(member.status)" effect="plain">
          {{ member.name }}
        </el-tag>
      </div>

      <div v-if="otherUploads.length" class="upload-notifs">
        <div v-for="upload in otherUploads" :key="upload.uploadId" class="upload-notif">
          <div class="notif-label">{{ upload.uploaderName }} 正在上传：{{ upload.fileName }}</div>
          <el-progress :percentage="upload.progress" :stroke-width="6" :show-text="false" />
        </div>
      </div>

      <UploadZone
        :drag-active="dragActive"
        :uploading="uploading"
        :upload-progress="uploadProgress"
        :upload-speed-text="uploadSpeedText"
        @choose-files="$emit('choose-files')"
        @drag-enter="$emit('drag-enter')"
        @drag-over="$emit('drag-over')"
        @drag-leave="$emit('drag-leave')"
        @drop-files="$emit('drop-files', $event)"
      />

      <div class="actions" style="margin-bottom:14px">
        <el-button type="primary" @click.stop="$emit('choose-files')">选择文件</el-button>
        <el-button type="success" @click.stop="$emit('choose-folder')">选择文件夹</el-button>
        <el-button v-if="selectedKeys.length" type="warning" @click="$emit('batch-download')">
          批量下载 ({{ selectedKeys.length }})
        </el-button>
        <el-button v-if="selectedKeys.length" type="danger" plain @click="$emit('clear-selection')">取消选择</el-button>
      </div>

      <div v-if="fileList.length === 0" class="empty">当前会话还没有共享文件</div>

      <template v-else>
        <div class="toolbar">
          <el-input v-model="fileSearchModel" placeholder="搜索文件名…" clearable style="width:200px" prefix-icon="Search" />
          <button class="sort-btn" :class="{ active: sortField === 'name' }" @click="$emit('toggle-sort', 'name')">
            名称 {{ sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
          </button>
          <button class="sort-btn" :class="{ active: sortField === 'size' }" @click="$emit('toggle-sort', 'size')">
            大小 {{ sortField === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
          </button>
          <button class="sort-btn" :class="{ active: sortField === 'uploadedAt' }" @click="$emit('toggle-sort', 'uploadedAt')">
            时间 {{ sortField === 'uploadedAt' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
          </button>
          <button v-if="sortField" class="sort-btn" title="清除排序，恢复手动顺序" @click="$emit('clear-sort')">
            ✕ 清除排序
          </button>
          <div class="toolbar-right">
            <el-button size="small" @click="$emit('toggle-select-all')">
              {{ selectedKeys.length === filteredFileList.length && filteredFileList.length > 0 ? '取消全选' : '全选' }}
            </el-button>
          </div>
        </div>

        <FolderBrowser
          v-if="folderBrowse"
          :folder-browse="folderBrowse"
          :current-folder-entry="currentFolderEntry"
          :rows="folderBrowseRows"
          @up="$emit('folder-up')"
          @download-zip="$emit('download-folder-zip', $event)"
          @enter="$emit('enter-sub-folder', $event)"
          @preview="$emit('preview', $event)"
          @download="$emit('download', $event)"
        />

        <template v-else>
          <FileTable
            :paged-file-list="pagedFileList"
            :image-preview-list="imagePreviewList"
            :my-real-ip="myRealIp"
            :drag-over-idx="dragOverIdx"
            @selection-change="$emit('selection-change', $event)"
            @drag-start="$emit('drag-start', $event)"
            @drag-enter-row="$emit('drag-enter-row', $event)"
            @drag-leave-row="$emit('drag-leave-row')"
            @drag-drop="$emit('drag-drop', $event)"
            @open-folder="$emit('open-folder', $event)"
            @download-folder-zip="$emit('download-folder-zip', $event)"
            @preview="$emit('preview', $event)"
            @download="$emit('download', $event)"
            @copy-link="$emit('copy-link', $event)"
            @rename="$emit('rename', $event)"
            @delete="$emit('delete', $event)"
          />
          <div
            v-if="filteredFileList.length > filePageSize"
            style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:10px"
          >
            <span style="font-size:13px;color:var(--muted)">共 {{ filteredFileList.length }} 个文件</span>
            <el-pagination
              v-model:current-page="fileCurrentPageModel"
              :page-size="filePageSize"
              :total="filteredFileList.length"
              layout="prev, pager, next"
              small
              background
            />
          </div>
        </template>
      </template>
    </div>
  </template>
</template>

<script setup>
import { statusType } from '@/utils/format'
import FileTable from './FileTable.vue'
import FolderBrowser from './FolderBrowser.vue'
import UploadZone from './UploadZone.vue'

const fileSearchModel = defineModel('fileSearch', { type: String, default: '' })
const fileCurrentPageModel = defineModel('fileCurrentPage', { type: Number, default: 1 })

defineProps({
  isConnected: Boolean,
  currentSessionId: String,
  currentSessionMembers: { type: Array, default: () => [] },
  otherUploads: { type: Array, default: () => [] },
  dragActive: Boolean,
  uploading: Boolean,
  uploadProgress: Number,
  uploadSpeedText: String,
  selectedKeys: { type: Array, default: () => [] },
  fileList: { type: Array, default: () => [] },
  filteredFileList: { type: Array, default: () => [] },
  pagedFileList: { type: Array, default: () => [] },
  filePageSize: Number,
  sortField: String,
  sortDir: String,
  folderBrowse: { type: Object, default: null },
  currentFolderEntry: { type: Object, default: null },
  folderBrowseRows: { type: Array, default: () => [] },
  imagePreviewList: { type: Array, default: () => [] },
  myRealIp: String,
  dragOverIdx: Number,
  chatOpen: Boolean,
  unreadCount: Number
})

defineEmits([
  'open-clip',
  'toggle-chat',
  'leave',
  'choose-files',
  'choose-folder',
  'drag-enter',
  'drag-over',
  'drag-leave',
  'drop-files',
  'batch-download',
  'clear-selection',
  'toggle-sort',
  'clear-sort',
  'toggle-select-all',
  'folder-up',
  'download-folder-zip',
  'enter-sub-folder',
  'preview',
  'download',
  'selection-change',
  'drag-start',
  'drag-enter-row',
  'drag-leave-row',
  'drag-drop',
  'open-folder',
  'copy-link',
  'rename',
  'delete'
])
</script>

