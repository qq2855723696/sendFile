<template>
  <el-dialog v-model="visible" :title="t('header.scanCode')" width="360px">
    <div style="text-align:center;padding:10px 0">
      <div v-if="loading" style="height:200px;display:grid;place-items:center;color:var(--muted)">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <el-icon :size="32" class="is-loading"><Loading /></el-icon>
          <span>{{ t('common.loading') }}</span>
        </div>
      </div>
      <template v-else>
        <img v-if="data && data.dataUrl" :src="data.dataUrl" style="width:240px;height:240px;border-radius:8px" alt="QR">
        <div v-if="data && data.url" style="margin-top:12px;font-size:13px;color:var(--muted)">{{ data.url }}</div>
        <div style="margin-top:6px;font-size:12px;color:var(--muted)">确保手机与电脑在同一局域网内</div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'
import { useLanguage } from '@/composables/useLanguage'
const { t } = useLanguage()

const visible = defineModel('visible', { type: Boolean, default: false })
defineProps({ loading: Boolean, data: { type: Object, default: () => ({}) } })
</script>
