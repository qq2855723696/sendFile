<template>
  <div v-if="progress.visible" class="dl-progress-bar">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
      <span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">
        ⬇️ {{ progress.name }}
      </span>
      <span style="font-size:12px;color:var(--muted);flex-shrink:0">{{ progress.percent }}%</span>
    </div>
    <el-progress :percentage="progress.percent" :stroke-width="8" :show-text="false" />
    <div style="margin-top:6px;font-size:12px;color:var(--muted)">
      {{ formatSize(progress.loaded) }} / {{ formatSize(progress.total) }}
    </div>
  </div>
</template>

<script setup>
import { formatSize } from '@/utils/format'

defineProps({
  progress: {
    type: Object,
    required: true
  }
})
</script>

