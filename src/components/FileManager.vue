<template>
  <template v-if="isConnected">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('file.fileManager') }}</h2>
      <div class="actions">
        <el-button size="small" @click="$emit('open-clip')">📋 {{ t('file.clipboard') }}</el-button>
        <el-button size="small" :type="chatOpen ? 'primary' : ''" @click="$emit('toggle-chat')">
          💬 {{ t('chat.chat') }}<span v-if="unreadCount" class="chat-badge">{{ unreadCount }}</span>
        </el-button>
        <el-button size="small" type="danger" plain @click="$emit('leave')">{{ t('session.leaveSession') }}</el-button>
      </div>
    </div>
    <div class="panel-body">
      <div class="member-row">
        <span>{{ t('session.members') }}：</span>
        <el-tag v-for="member in currentSessionMembers" :key="member.ip" :type="statusType(member.status)" effect="plain">
          {{ member.name }}
        </el-tag>
      </div>

      <div v-if="otherUploads.length" class="upload-notifs">
        <div v-for="upload in otherUploads" :key="upload.uploadId" class="upload-notif">
          <div class="notif-label">{{ upload.uploaderName }} {{ t('file.uploading') }}：{{ upload.fileName }}</div>
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
        <el-button type="primary" @click.stop="$emit('choose-files')">{{ t('file.uploadFile') }}</el-button>
        <el-button type="success" @click.stop="$emit('choose-folder')">{{ t('file.uploadFolder') }}</el-button>
        <el-button v-if="selectedKeys.length" type="warning" @click="$emit('batch-download')">
          {{ t('file.batchDownload') }} ({{ selectedKeys.length }})
        </el-button>
        <el-button v-if="selectedKeys.length" type="danger" plain @click="$emit('clear-selection')">{{ t('file.cancelSelection') }}</el-button>
      </div>

      <div v-if="fileList.length === 0" class="empty">{{ t('file.noFiles') }}</div>

      <template v-else>
        <div class="toolbar">
          <el-input v-model="fileSearchModel" :placeholder="t('file.searchFiles')" clearable style="width:200px" :prefix-icon="Search" />
          <el-button-group class="sort-group">
            <el-button size="small" :type="sortField === 'name' ? 'primary' : ''" plain @click="$emit('toggle-sort', 'name')">
              {{ t('file.fileName') }}
              <span v-if="sortField === 'name'" class="sort-arrow">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </el-button>
            <el-button size="small" :type="sortField === 'size' ? 'primary' : ''" plain @click="$emit('toggle-sort', 'size')">
              {{ t('file.fileSize') }}
              <span v-if="sortField === 'size'" class="sort-arrow">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </el-button>
            <el-button size="small" :type="sortField === 'uploadedAt' ? 'primary' : ''" plain @click="$emit('toggle-sort', 'uploadedAt')">
              {{ t('file.uploadTime') }}
              <span v-if="sortField === 'uploadedAt'" class="sort-arrow">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </el-button>
          </el-button-group>
          <el-button v-if="sortField" size="small" @click="$emit('clear-sort')">
            <el-icon><Close /></el-icon>
            {{ t('file.clearSort') }}
          </el-button>
          <div class="toolbar-right">
            <el-button size="small" @click="$emit('toggle-select-all')">
              {{ selectedKeys.length === filteredFileList.length && filteredFileList.length > 0 ? t('file.cancelSelection') : t('file.selectAll') }}
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
            max-height="420"
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
          <div v-if="filteredFileList.length > filePageSize" class="file-pagination">
            <span class="pagination-info">{{ t('file.fileList') }} {{ filteredFileList.length }} {{ t('common.items', { n: filteredFileList.length }) }}</span>
            <el-pagination
              v-model:current-page="fileCurrentPageModel"
              v-model:page-size="filePageSizeModel"
              :page-size="filePageSize"
              :page-sizes="[20, 50, 100]"
              :total="filteredFileList.length"
              layout="total, sizes, prev, pager, next"
              small
              background
            />
          </div>
          <div v-else-if="filteredFileList.length > 0" class="file-pagination">
            <span class="pagination-info">共 {{ filteredFileList.length }} 个文件</span>
          </div>
        </template>
      </template>
    </div>
  </template>
</template>

<script setup>
import { Close, Search } from '@element-plus/icons-vue'
import { useLanguage } from '@/composables/useLanguage'
import { statusType } from '@/utils/format'
import FileTable from './FileTable.vue'
import FolderBrowser from './FolderBrowser.vue'
import UploadZone from './UploadZone.vue'

const { t } = useLanguage()

const fileSearchModel = defineModel('fileSearch', { type: String, default: '' })
const fileCurrentPageModel = defineModel('fileCurrentPage', { type: Number, default: 1 })
const filePageSizeModel = defineModel('filePageSize', { type: Number, default: 20 })

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
  filePageSize: { type: Number, default: 20 },
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
