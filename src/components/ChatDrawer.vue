<template>
  <div class="chat-drawer" :class="{ open }">
    <div class="chat-header">
      <span>💬 {{ t('chat.chat') }}</span>
      <el-button size="small" circle @click="$emit('close')">✕</el-button>
    </div>
    <div ref="chatMsgs" class="chat-msgs">
      <div v-if="messages.length === 0" style="color:var(--muted);text-align:center;padding:24px;font-size:13px">
        {{ t('chat.noMessages') }}
      </div>
      <div
        v-for="message in messages"
        :key="message.timestamp + message.fromIp"
        class="chat-bubble"
        :class="message.fromIp === myRealIp ? 'me' : 'other'"
      >
        <div v-if="message.fromIp !== myRealIp" class="sender">{{ message.fromName }}</div>
        <div>{{ message.content }}</div>
        <div class="time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>
    <div class="chat-input-row">
      <el-input v-model="chatInputModel" :placeholder="t('chat.messagePlaceholder')" style="flex:1" @keydown.enter.prevent="$emit('send')" />
      <el-button type="primary" @click="$emit('send')">{{ t('chat.send') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { formatTime } from '@/utils/format'

const { t } = useLanguage()

const chatInputModel = defineModel('chatInput', { type: String, default: '' })
const chatMsgs = ref(null)

defineProps({
  open: Boolean,
  messages: { type: Array, default: () => [] },
  myRealIp: String
})

defineEmits(['close', 'send'])

function scrollChat() {
  nextTick(() => {
    if (chatMsgs.value) chatMsgs.value.scrollTop = chatMsgs.value.scrollHeight
  })
}

defineExpose({ scrollChat })
</script>
