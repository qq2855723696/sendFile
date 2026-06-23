<template>
  <el-dialog v-model="visible" title="🕐 传输历史记录" width="600px">
    <div v-if="history.length === 0" class="empty" style="min-height:100px">暂无历史记录</div>
    <el-table v-else :data="history" border stripe max-height="360">
      <el-table-column label="文件名" prop="name" min-width="180" />
      <el-table-column label="大小" width="100" align="center">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="时间" prop="time" width="165" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.ok ? 'success' : 'danger'">{{ row.ok ? '完成' : '失败' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button type="danger" plain @click="$emit('clear')">清空历史</el-button>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { formatSize } from '@/utils/format'

const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  history: { type: Array, default: () => [] }
})

defineEmits(['clear'])
</script>

