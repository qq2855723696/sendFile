# SendFile Bug 清单

> 生成日期：2026-06-25
> 最后更新：2026-06-25
> 项目版本：2.0.0
> 审查范围：全项目源码（Electron + Vue 3 + Express 后端）

---

## ✅ 已修复的 Bug

### 🔴 Bug #1：WebSocket URL 拼接逻辑错误，非默认端口时连接失败

**文件**: `src/composables/useWebSocket.js` 第 14 行

**问题描述**:
```js
const devPort = location.port === '5173' ? ':3000' : location.port ? `:${location.port}` : ''
```
当 Vite 开发服务器运行在非 5173 端口（如 5174、8080 等）时，`location.port` 会是 Vite 的端口号（如 `5174`），而不是后端 Express 的端口（3000）。此时 WebSocket 会尝试连接 `ws://hostname:5174`，但实际后端在 3000 端口，导致连接失败。

**影响**: 开发环境下非默认端口时 WebSocket 无法连接，所有实时功能（上线、聊天、文件列表同步）全部失效。

**修复**: ✅ 已修复。改进了端口检测逻辑，当 Vite 端口为 5173 时映射到 3000，其他非 3000 端口直接使用（适用于后端与前端同端口部署的场景）。

---

### 🔴 Bug #3：`useLanguage` 组合式函数返回的 `currentLanguage` 是只读的，但 App.vue 直接修改其 `.value`

**文件**: `src/composables/useLanguage.js` 第 109 行 + `src/App.vue` 第 350 行

**问题描述**:
```js
// useLanguage.js
return {
  currentLanguage: readonly(currentLanguage),  // ← 返回的是只读版本
  ...
}

// App.vue
const { t, setLanguage, getCurrentLanguage, getSupportedLanguages } = useLanguage()
currentLanguage.value = getCurrentLanguage()  // ← 试图修改 readonly ref 的 value
```
`useLanguage()` 返回的 `currentLanguage` 是通过 `readonly()` 包装的，修改其 `.value` 在严格模式下会报错，在静默模式下会静默失败。

**影响**: `currentLanguage` 的值可能与实际语言不一致，导致界面显示的语言选择器状态不正确。

**修复**: ✅ 已修复。App.vue 中创建独立的 `currentLanguage` ref，通过 `watch` 自动调用 `setLanguage()` 与 i18n 模块保持同步。

---

### 🔴 Bug #8：`DevicePanel` 中 `showQr` 和 `qrData` 定义了但 `loadQrCode` 从未被调用

**文件**: `src/components/DevicePanel.vue` 第 113-140 行

**问题描述**:
```js
const showQr = ref(false)
const qrData = ref({})

async function loadQrCode() {
  try {
    qrData.value = await getQrCode()
  } catch {
    ElMessage.error('二维码加载失败')
  }
}
```
`loadQrCode` 函数被定义但从未被调用。当用户点击"📱 显示二维码"按钮时，对话框会打开但二维码永远不会加载（没有触发 `loadQrCode`）。

**影响**: DevicePanel 中的二维码功能不可用，对话框打开后只显示"加载中..."。

**修复**: ✅ 已修复。添加了 `watch(showQr, ...)` 监听器，当对话框打开时自动调用 `loadQrCode()`。

---

### 🔴 Bug #9：`copyMyIp` 从 localStorage 读取 IP，但 IP 从未被存储到 localStorage

**文件**: `src/components/DevicePanel.vue` 第 120-132 行

**问题描述**:
```js
async function copyMyIp() {
  const ip = localStorage.getItem('sendfile.myIp') || ''
  if (ip) {
    await navigator.clipboard.writeText(ip)
    ElMessage.success('IP 已复制')
  } else {
    ElMessage.warning('请先上线设备')
  }
}
```
后端在 `ONLINE` 消息中发送 `MY_IP`，前端在 `handleMessage` 的 `MY_IP` 处理函数中更新 `myRealIp.value`，但从未将 IP 存储到 `localStorage`。因此 `localStorage.getItem('sendfile.myIp')` 永远返回 `null`。

**影响**: "复制 IP" 按钮永远提示"请先上线设备"，即使已上线。

**修复**: ✅ 已修复。两处修改：
1. App.vue 的 `MY_IP` 处理函数中添加了 `localStorage.setItem('sendfile.myIp', msg.ip)`
2. DevicePanel 的 `copyMyIp` 函数优先使用 `myRealIp.value`（实时值），其次才从 localStorage 读取

---

### 🔴 Bug #10：`App.vue` 中 `currentLanguage` 初始值与 `useLanguage` 返回的 `currentLanguage` 不一致

**文件**: `src/App.vue` 第 331 行 + 第 350 行

**问题描述**:
```js
// 第 331 行
const currentLanguage = ref(DEFAULT_LANGUAGE)  // ← 使用常量默认值 'zh-CN'

// 第 350 行
currentLanguage.value = getCurrentLanguage()  // ← 用 useLanguage 的值覆盖
```
`App.vue` 中定义了一个独立的 `currentLanguage` ref，初始值为 `DEFAULT_LANGUAGE`（'zh-CN'），然后在 setup 中调用 `getCurrentLanguage()` 覆盖。但 `getCurrentLanguage()` 读取的是 `localStorage.getItem(LANGUAGE_KEY)`，如果用户之前切换过语言，这里会正确获取。

问题在于：`useLanguage()` 内部也有一个独立的 `currentLanguage` ref，与 `App.vue` 中的完全独立。两者可能不同步。

**影响**: 语言状态在 `App.vue` 和 `useLanguage` 之间不同步，可能导致 UI 显示的语言与实际翻译语言不一致。

**修复**: ✅ 已修复。移除了重复的 `const currentLanguage = ref(DEFAULT_LANGUAGE)` 声明，统一使用一个独立的 ref，通过 `watch` 与 `setLanguage()` 保持同步。

---

### 🟡 Bug #12：`folderBrowseUp` 在 `subPath` 为空字符串时返回上级行为不正确

**文件**: `src/App.vue` 第 955-963 行

**问题描述**:
```js
function folderBrowseUp() {
  if (!folderBrowse.value?.subPath) {
    folderBrowse.value = null
    return
  }
  const parts = folderBrowse.value.subPath.split('/').filter(Boolean)
  parts.pop()
  folderBrowse.value.subPath = parts.join('/')  // ← 空数组 join 后是空字符串 ''
}
```
当用户在子文件夹中点击返回上级，如果 `subPath` 只剩一级（如 `'sub'`），`pop()` 后 `parts` 为空数组，`join('/')` 返回空字符串 `''`。此时 `folderBrowse.value.subPath` 被设为 `''`，但 `folderBrowse` 不为 `null`，所以用户仍在文件夹浏览模式而非回到根目录。需要再次点击才能回到根目录。

**影响**: 从子文件夹返回根目录需要点击两次"返回上级"。

**修复**: ✅ 已修复。当 `parts` 为空时，直接将 `folderBrowse.value` 设为 `null`，回到根目录。

---

### 🟡 Bug #18：`App.vue` 中 `watch(chatOpen)` 与 `toggleChat` 功能重复

**文件**: `src/App.vue` 第 1291-1296 行

**问题描述**:
```js
watch(chatOpen, visible => {
  if (visible) {
    unreadCount.value = 0
    scrollChat()
  }
})

function toggleChat() {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value) {
    unreadCount.value = 0
    scrollChat()
  }
}
```
`watch(chatOpen)` 和 `toggleChat` 中的逻辑完全重复。当 `toggleChat` 修改 `chatOpen` 时，`watch` 也会触发，导致 `unreadCount.value = 0` 和 `scrollChat()` 被执行两次。

**影响**: 无功能影响，但代码冗余，`scrollChat()` 被调用两次可能产生轻微性能问题。

**修复**: ✅ 已修复。保留 `watch` 作为唯一的状态同步机制，`toggleChat` 只需切换 `chatOpen` 的值。

---

### 🟡 Bug #24：`detectFolderUpload` 对根目录文件的 `webkitRelativePath` 处理不正确

**文件**: `src/App.vue` 第 754-758 行

**问题描述**:
```js
function detectFolderUpload(files) {
  const path = files[0]?.webkitRelativePath
  if (!path) return null
  return { batchId: createUuid(), rootName: path.replace(/\\/g, '/').split('/')[0], fileCount: files.length }
}
```
如果用户选择了根目录的文件（如 `file.txt`），`webkitRelativePath` 可能是 `file.txt`（无路径分隔符），此时 `split('/')[0]` 返回文件名本身，会被误判为文件夹上传（`rootName = 'file.txt'`）。

**影响**: 上传根目录单个文件时可能被误判为文件夹上传，导致服务器端创建无效的文件夹批次。

**修复**: ✅ 已修复。添加了路径分隔符检查：`if (slashIdx < 0) return null`，只有包含路径分隔符时才认为是文件夹上传。

---

### 🟡 Bug #27：`addNotification` 使用 `Date.now()` 作为 ID，快速连续调用时可能产生重复 ID

**文件**: `src/App.vue` 第 1189-1195 行

**问题描述**:
```js
function addNotification(type, title, message = '') {
  const id = Date.now()
  notifications.value.push({ id, type, title, message })
  setTimeout(() => {
    dismissNotification(id)
  }, NOTIFICATION_DURATION)
}
```
如果两个通知在 1 秒内（同一毫秒）创建，它们的 ID 会相同。`dismissNotification` 使用 `findIndex` 查找第一个匹配的 ID 并删除，导致只删除一个通知，另一个永远留在界面上。

**影响**: 快速操作时（如连续上传多个文件），通知可能无法自动消失。

**修复**: ✅ 已修复。使用递增序列号 `notifSeq` 确保 ID 唯一：`const id = Date.now() + (++notifSeq)`。

---

### 🟢 Bug #16：`NotificationContainer` 中导入了 `ref` 但未使用

**文件**: `src/components/NotificationContainer.vue` 第 28 行

**问题描述**:
```js
import { ref } from 'vue'
```
`ref` 被导入但在 `<script setup>` 中从未使用。

**影响**: 无功能影响，但增加了不必要的打包体积。

**修复**: ✅ 已修复。移除了未使用的 `import { ref } from 'vue'`。

---

### 🟢 额外修复：`useTransferHistory` 缺少 JSON 解析错误处理

**文件**: `src/composables/useTransferHistory.js`

**问题描述**:
```js
const transferHistory = ref(JSON.parse(localStorage.getItem('sendfile.history') || '[]'))
```
如果 localStorage 中的数据被损坏（无效 JSON），`JSON.parse` 会抛出异常，导致应用启动失败。

**影响**: 用户浏览器 localStorage 数据损坏时，应用无法启动。

**修复**: ✅ 已修复。添加了 try-catch 保护，解析失败时初始化为空数组。

---

## ❌ 确认为非 Bug（误报）

以下条目在初次审查时被标记为 Bug，经深入验证后确认不是问题：

- **原 Bug #2** — `addNotification` 中 `this` 指向：`dismissNotification` 是模块级函数，`setTimeout` 回调中调用正常
- **原 Bug #4** — `t` 函数响应式：`t` 函数在每次调用时读取 `currentLanguage.value`，模板中可正常追踪
- **原 Bug #5** — WebSocket 端口逻辑：与原 Bug #1 重复
- **原 Bug #6** — 批量下载跳过文件夹：这是预期行为，文件夹应通过专门的 ZIP 下载
- **原 Bug #7** — SessionLobby 备注功能：功能未完全实现，属于未完成功能而非 Bug
- **原 Bug #11** — `useKeyboard` 修改常量：`registerShortcut` 当前未被调用
- **原 Bug #13** — 拖拽排序 -1 边界：已有完善的防护检查
- **原 Bug #14** — 文件 input value 清空：标准浏览器行为
- **原 Bug #15** — fetch 无 AbortController：功能增强需求，非 Bug
-  原 Bug #17** — 未使用的变量：代码清理项，非 Bug
- **原 Bug #19** — 未使用的常量：代码清理项，非 Bug
- **原 Bug #20** — 重连/断开时序：设计如此
- **原 Bug #21** — onPaste 未阻止默认行为：未连接时允许默认粘贴是合理的
- **原 Bug #22** — multer 文件大小余量：余量足够，不是问题
- **原 Bug #23** — splice -1 边界：已有防护
- **原 Bug #25** — backToList 时序：可接受的行为
- **原 Bug #26** — MAX_FILE_SIZE 重复定义：维护风险，非 Bug
-  原 Bug #28** — 通知 ID 重复：与原 Bug #27 重复
- **原 Bug #29** — defineModel 用法：功能正常
- **原 Bug #30** — qrData reactive vs ref：经审查，`qrData` 实际使用的是 `ref({})`，报告有误

---

## 📊 修复统计

| 状态 | 数量 | 编号 |
|------|------|------|
| ✅ 已修复 | 10 | #1, #3, #8, #9, #10, #12, #16, #18, #24, #27 |
| ✅ 误报（已排除） | 20 | #2, #4, #5, #6, #7, #11, #13, #14, #15, #17, #19, #20, #21, #22, #23, #25, #26, #28, #29, #30 |

**总计: 10 个 Bug 已修复，20 个误报已排除**

---

## 🔧 建议后续改进

1. **未使用的常量清理** — `constants/index.js` 中有约 10 个未使用的常量（`TRANSACTION_QUEUE_KEY`、`CACHE_SIZE_LIMIT` 等），建议清理
2. **SessionLobby 备注功能** — 代码中有备注按钮和对话框逻辑，但模板中缺少 `el-dialog` 元素，功能未完成
3. **未使用的变量清理** — `App.vue` 中 `dragActive` 和 `dragDepth` 仅传递给子组件，可在子组件内部管理
4. **语言切换优化** — 当前语言切换通知使用中文硬编码，应使用 i18n 翻译
5. **Electron 窗口** — `webSecurity: false` 在生产环境中存在安全风险，建议配置允许的域名
