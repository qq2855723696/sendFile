<template>
  <el-dialog v-model="visible" :title="t('header.history')" width="600px">
    <div v-if="history.length === 0" class="empty" style="min-height:100px">{{ t('file.noFiles') }}</div>
    <el-table v-else :data="history" border stripe max-height="360">
      <el-table-column :label="t('file.fileName')" prop="name" min-width="180" />
      <el-table-column :label="t('file.fileSize')" width="100" align="center">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column :label="t('file.uploadTime')" prop="time" width="165" />
      <el-table-column :label="t('device.status')" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.ok ? 'success' : 'danger'">{{ row.ok ? t('common.success') : t('common.error') }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button type="danger" plain @click="$emit('clear')">{{ t('settings.clearHistory') }}</el-button>
      <el-button @click="visible = false">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useLanguage } from '@/composables/useLanguage'
import { formatSize } from '@/utils/format'

const { t } = useLanguage()
const visible = defineModel('visible', { type: Boolean, default: false })
defineProps({ history: { type: Array, default: () => [] } })
defineEmits(['clear'])
</script>
