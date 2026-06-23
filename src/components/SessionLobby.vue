<template>
  <template v-if="!isConnected">
    <div class="panel-header">
      <h2 class="panel-title">会话大厅</h2>
      <el-button size="small" @click="$emit('refresh')">刷新连接</el-button>
    </div>
    <div class="panel-body">
      <div class="stats">
        <div class="stat">
          <div class="stat-label">在线设备</div>
          <div class="stat-value">{{ radar.onlineCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">活跃会话</div>
          <div class="stat-value">{{ radar.activeSessionCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">传输任务</div>
          <div class="stat-value">{{ radar.activeTransferCount }}</div>
        </div>
      </div>

      <el-tabs v-model="activeTabModel">
        <el-tab-pane label="可连接设备" name="devices">
          <div v-if="!localOnline" class="empty">请先上线本机设备</div>
          <div v-else-if="deviceList.length === 0" class="empty">暂无可连接设备</div>
          <el-table v-else :data="deviceList" border stripe height="340">
            <el-table-column label="设备" min-width="180">
              <template #default="{ row }">
                <strong>{{ row.name }}</strong>
                <el-tag size="small" :type="statusType(row.status)" style="margin-left:6px">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="IP 地址" prop="ip" min-width="140" />
            <el-table-column label="安全" width="90" align="center">
              <template #default="{ row }">{{ row.hasPin ? '🔒 PIN' : '🔓 开放' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="$emit('connect-device', row)">连接</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="加入会话" name="groups">
          <div v-if="!localOnline" class="empty">请先上线本机设备</div>
          <div v-else-if="groupList.length === 0" class="empty">暂无可加入的会话</div>
          <el-table v-else :data="groupList" border stripe height="340">
            <el-table-column label="会话 ID" prop="id" width="110" />
            <el-table-column label="成员" min-width="200">
              <template #default="{ row }">{{ row.members.map(member => member.name).join('、') }}</template>
            </el-table-column>
            <el-table-column label="人数" prop="memberCount" width="80" align="center" />
            <el-table-column label="操作" width="110" align="center">
              <template #default="{ row }">
                <el-button
                  type="success"
                  size="small"
                  :disabled="isConnected"
                  :title="isConnected ? '已在会话中，请先离开当前会话' : '申请加入群组'"
                  @click="$emit('join-group', row)"
                >
                  申请加入
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="网络概览" name="radar">
          <el-table :data="radar.devices" border stripe height="340">
            <el-table-column label="设备" prop="name" min-width="180" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="会话中" width="90" align="center">
              <template #default="{ row }">{{ row.inSession ? '✅' : '—' }}</template>
            </el-table-column>
            <el-table-column label="IP" prop="ip" min-width="140" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </template>
</template>

<script setup>
import { statusText, statusType } from '@/utils/format'

const activeTabModel = defineModel('activeTab', { type: String, default: 'devices' })

defineProps({
  isConnected: Boolean,
  localOnline: Boolean,
  deviceList: { type: Array, default: () => [] },
  groupList: { type: Array, default: () => [] },
  radar: {
    type: Object,
    default: () => ({ onlineCount: 0, activeSessionCount: 0, activeTransferCount: 0, devices: [], sessions: [] })
  }
})

defineEmits(['refresh', 'connect-device', 'join-group'])
</script>

