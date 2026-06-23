<template>
  <el-dialog v-model="visible" title="📱 手机扫码直连" width="360px">
    <div style="text-align:center;padding:10px 0">
      <div v-if="loading" style="height:200px;display:grid;place-items:center;color:var(--muted)">生成中…</div>
      <template v-else>
        <img :src="data.dataUrl" style="width:240px;height:240px;border-radius:8px" alt="QR">
        <div style="margin-top:12px;font-size:13px;color:var(--muted)">{{ data.url }}</div>
        <div style="margin-top:6px;font-size:12px;color:var(--muted)">确保手机与电脑在同一局域网内</div>
      </template>
    </div>
  </el-dialog>
</template>

<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })

defineProps({
  loading: Boolean,
  data: { type: Object, default: () => ({}) }
})
</script>

