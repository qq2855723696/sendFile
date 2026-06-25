<template>
  <div v-if="visible" class="guide-overlay" @click.self="handleSkip">
    <div
      class="guide-tooltip"
      :style="tooltipStyle"
      :class="{ 'guide-mobile': isMobile }"
    >
      <div class="guide-header">
        <span class="guide-step">{{ currentStep + 1 }}/{{ steps.length }}</span>
        <span class="guide-title">{{ currentStepData?.title }}</span>
      </div>
      <p class="guide-description">{{ currentStepData?.description }}</p>
      <div class="guide-actions">
        <el-button size="small" @click="handleSkip">跳过</el-button>
        <el-button type="primary" size="small" @click="handleNext">
          {{ currentStep === steps.length - 1 ? '完成' : '下一步' }}
        </el-button>
      </div>
      <div class="guide-dots">
        <span
          v-for="(_, index) in steps"
          :key="index"
          class="dot"
          :class="{ active: index === currentStep }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { GUIDE_SHOWN_KEY, GUIDE_STEPS } from '@/constants'

const props = defineProps({
  steps: {
    type: Array,
    default: () => GUIDE_STEPS
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['next', 'skip', 'complete'])

const currentStep = ref(0)
const targetElement = ref(null)
const isMobile = ref(false)

const currentStepData = computed(() => props.steps[currentStep.value])

const tooltipStyle = computed(() => {
  // 该步骤没有对应的高亮目标时居中显示，避免提示框定位丢失贴在左上角
  if (!targetElement.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90vw',
      maxWidth: '400px'
    }
  }
  const rect = targetElement.value.getBoundingClientRect()
  const isMobileDevice = window.innerWidth < 768

  if (isMobileDevice) {
    return {
      top: `${rect.bottom + 12}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90vw',
      maxWidth: '360px'
    }
  }

  return {
    top: `${rect.bottom + 12}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: 'translateX(-50%)',
    minWidth: '280px',
    maxWidth: '400px'
  }
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function updateTarget() {
  const step = props.steps[currentStep.value]
  // 始终重置目标：步骤无 target 或找不到元素时置空，避免沿用上一步的定位
  if (!step?.target) {
    targetElement.value = null
    return
  }
  const selector = `[data-guide="${step.target}"]`
  targetElement.value = document.querySelector(selector)
}

function handleNext() {
  if (currentStep.value === props.steps.length - 1) {
    handleComplete()
  } else {
    currentStep.value++
    updateTarget()
    emit('next', currentStep.value)
  }
}

function handleSkip() {
  emit('skip')
  markGuideAsShown()
}

function handleComplete() {
  emit('complete')
  markGuideAsShown()
}

function markGuideAsShown() {
  localStorage.setItem(GUIDE_SHOWN_KEY, 'true')
}

function handleResize() {
  checkMobile()
}

onMounted(() => {
  checkMobile()
  if (props.visible) {
    updateTarget()
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentStep.value = 0
    updateTarget()
  }
})

defineExpose({
  currentStep,
  updateTarget
})
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.guide-tooltip {
  position: absolute;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  animation: guideFadeIn 0.3s ease;
}

.guide-tooltip.guide-mobile {
  position: fixed;
  bottom: 20px;
  top: auto !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
}

@keyframes guideFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.guide-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.guide-step {
  background: #409eff;
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.guide-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.guide-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.guide-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.guide-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dcdfe6;
  transition: all 0.3s ease;
}

.dot.active {
  background: #409eff;
  width: 20px;
  border-radius: 4px;
}
</style>
