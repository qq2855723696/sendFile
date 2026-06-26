<template>
  <template v-if="!isConnected">
    <div class="panel-header">
      <h2 class="panel-title">{{ t('session.sessionLobby') }}</h2>
      <div class="header-actions">
        <el-button size="small" @click="$emit('refresh')">{{ t('common.refresh') }}</el-button>
      </div>
    </div>
    <div class="panel-body">
      <div class="stats">
        <div class="stat">
          <div class="stat-label">{{ t('session.onlineDevices') }}</div>
          <div class="stat-value">{{ radar.onlineCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">{{ t('session.activeSessions') }}</div>
          <div class="stat-value">{{ radar.activeSessionCount }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">{{ t('session.activeTransfers') }}</div>
          <div class="stat-value">{{ radar.activeTransferCount }}</div>
        </div>
      </div>

      <el-tabs v-model="activeTabModel">
        <el-tab-pane :label="t('device.deviceList')" name="devices">
          <div v-if="!localOnline" class="empty">{{ t('device.pleaseOnline') }}</div>
          <div v-else-if="deviceList.length === 0" class="empty">{{ t('device.noDevices') }}</div>
          <template v-else>
            <el-table :data="pagedDeviceList" border stripe height="340">
              <el-table-column :label="t('device.name')" min-width="200">
                <template #default="{ row }">
                  <strong>{{ row.name }}</strong>
                  <el-tag size="small" :type="statusType(row.status)" style="margin-left:6px">{{ statusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="IP" prop="ip" width="150" />
              <el-table-column :label="t('device.pinCode')" width="100" align="center">
                <template #default="{ row }">{{ row.hasPin ? '🔒 PIN' : '🔓 ' + t('device.pinDisabled') }}</template>
              </el-table-column>
              <el-table-column :label="t('common.more')" width="80" align="center">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="$emit('connect-device', row)">{{ t('device.connect') }}</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-if="deviceList.length > pageSizes.devices"
              v-model:current-page="currentPages.devices"
              v-model:page-size="pageSizes.devices"
              :total="deviceList.length"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              small
              style="margin-top:12px;justify-content:flex-end"
            />
          </template>
        </el-tab-pane>

        <el-tab-pane :label="t('session.joinSession')" name="groups">
          <div v-if="!localOnline" class="empty">{{ t('device.pleaseOnline') }}</div>
          <div v-else-if="groupList.length === 0" class="empty">{{ t('session.noSessions') }}</div>
          <template v-else>
            <el-table :data="pagedGroupList" border stripe height="340">
              <el-table-column :label="t('session.sessionId')" prop="id" width="130" />
              <el-table-column :label="t('session.members')" min-width="200">
                <template #default="{ row }">{{ row.members.map(member => member.name).join('、') }}</template>
              </el-table-column>
              <el-table-column :label="t('session.memberCount')" prop="memberCount" width="70" align="center" />
              <el-table-column :label="t('common.more')" width="100" align="center">
                <template #default="{ row }">
                  <el-button type="success" size="small" :disabled="isConnected" :title="isConnected ? t('session.pleaseLeaveFirst') : t('session.applyJoin')" @click="$emit('join-group', row)">
                    {{ t('session.applyJoin') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-if="groupList.length > pageSizes.groups"
              v-model:current-page="currentPages.groups"
              v-model:page-size="pageSizes.groups"
              :total="groupList.length"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              small
              style="margin-top:12px;justify-content:flex-end"
            />
          </template>
        </el-tab-pane>

        <el-tab-pane :label="t('session.networkOverview')" name="radar">
          <template v-if="radar.devices && radar.devices.length > 0">
            <el-table :data="pagedRadarDevices" border stripe height="340">
              <el-table-column :label="t('device.name')" prop="name" min-width="200" />
              <el-table-column :label="t('device.status')" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="t('session.inSession')" width="80" align="center">
                <template #default="{ row }">{{ row.inSession ? '✅' : '—' }}</template>
              </el-table-column>
              <el-table-column label="IP" prop="ip" width="150" />
            </el-table>
            <el-pagination
              v-if="radar.devices.length > pageSizes.radar"
              v-model:current-page="currentPages.radar"
              v-model:page-size="pageSizes.radar"
              :total="radar.devices.length"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              small
              style="margin-top:12px;justify-content:flex-end"
            />
          </template>
          <div v-else class="empty">{{ t('session.noSessions') }}</div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </template>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { statusType } from '@/utils/format'

const { t } = useLanguage()

const activeTabModel = defineModel('activeTab', { type: String, default: 'devices' })

const props = defineProps({
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

const pageSizes = reactive({ devices: 10, groups: 10, radar: 10 })
const currentPages = reactive({ devices: 1, groups: 1, radar: 1 })

const pagedDeviceList = computed(() => {
  const start = (currentPages.devices - 1) * pageSizes.devices
  return props.deviceList.slice(start, start + pageSizes.devices)
})
const pagedGroupList = computed(() => {
  const start = (currentPages.groups - 1) * pageSizes.groups
  return props.groupList.slice(start, start + pageSizes.groups)
})
const pagedRadarDevices = computed(() => {
  const devices = props.radar.devices || []
  const start = (currentPages.radar - 1) * pageSizes.radar
  return devices.slice(start, start + pageSizes.radar)
})

function statusLabel(status) {
  const map = { online: t('device.onlineStatus'), busy: t('device.busyStatus'), away: t('device.awayStatus') }
  return map[status] || status
}

watch(() => props.deviceList, () => { currentPages.devices = 1 })
watch(() => props.groupList, () => { currentPages.groups = 1 })
watch(() => props.radar.devices, () => { currentPages.radar = 1 })
</script>
