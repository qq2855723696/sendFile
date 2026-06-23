import { ref } from 'vue'
import { GUIDE_SHOWN_KEY } from '@/constants'

/**
 * 首次使用引导状态管理
 */
export function useGuide() {
  const isGuideShown = ref(false)
  const isGuideVisible = ref(false)

  /**
   * 检查引导是否已完成
   */
  function checkGuideStatus() {
    const shown = localStorage.getItem(GUIDE_SHOWN_KEY)
    isGuideShown.value = shown === 'true'
    return isGuideShown.value
  }

  /**
   * 显示引导
   */
  function showGuide() {
    if (!isGuideShown.value) {
      isGuideVisible.value = true
    }
  }

  /**
   * 隐藏引导
   */
  function hideGuide() {
    isGuideVisible.value = false
  }

  /**
   * 完成引导
   */
  function completeGuide() {
    localStorage.setItem(GUIDE_SHOWN_KEY, 'true')
    isGuideShown.value = true
    isGuideVisible.value = false
  }

  /**
   * 跳过引导
   */
  function skipGuide() {
    completeGuide()
  }

  /**
   * 重置引导（用于测试或重新显示）
   */
  function resetGuide() {
    localStorage.removeItem(GUIDE_SHOWN_KEY)
    isGuideShown.value = false
    isGuideVisible.value = false
  }

  /**
   * 初始化引导状态
   */
  function initGuide() {
    checkGuideStatus()
    return {
      isGuideShown: isGuideShown.value,
      isGuideVisible: isGuideVisible.value
    }
  }

  return {
    isGuideShown,
    isGuideVisible,
    checkGuideStatus,
    showGuide,
    hideGuide,
    completeGuide,
    skipGuide,
    resetGuide,
    initGuide
  }
}
