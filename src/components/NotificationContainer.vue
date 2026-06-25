<template>
  <div class="notification-container">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="[`notification-${notification.type}`]"
        @click="handleDismiss(notification.id)"
      >
        <div class="notification-icon">
          <el-icon v-if="notification.type === 'success'" color="#67c23a"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="notification.type === 'error'" color="#f56c6c"><CircleCloseFilled /></el-icon>
          <el-icon v-else-if="notification.type === 'warning'" color="#e6a23c"><WarningFilled /></el-icon>
          <el-icon v-else color="#409eff"><InfoFilled /></el-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div v-if="notification.message" class="notification-message">{{ notification.message }}</div>
        </div>
        <el-icon class="notification-close" @click.stop="handleDismiss(notification.id)"><Close /></el-icon>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { CircleCheckFilled, CircleCloseFilled, WarningFilled, InfoFilled, Close } from '@element-plus/icons-vue'

const props = defineProps({
  notifications: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['dismiss'])

function handleDismiss(id) {
  emit('dismiss', id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 90vw;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  cursor: pointer;
  min-width: 280px;
  max-width: 400px;
  border-left: 4px solid;
}

.notification-success {
  border-left-color: #67c23a;
}

.notification-error {
  border-left-color: #f56c6c;
}

.notification-warning {
  border-left-color: #e6a23c;
}

.notification-info {
  border-left-color: #409eff;
}

.notification-icon {
  flex-shrink: 0;
  font-size: 20px;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.notification-close {
  flex-shrink: 0;
  color: #909399;
  font-size: 16px;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s;
}

.notification-close:hover {
  background: #f5f7fa;
  color: #606266;
}

/* 动画 */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .notification-container {
    top: auto;
    bottom: 20px;
    right: 10px;
    left: 10px;
  }

  .notification-item {
    min-width: auto;
    max-width: none;
  }
}
</style>
