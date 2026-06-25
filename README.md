# SendFile — 局域网文件快传

> 近在同网，传输即达。无需登录、无需公网、无需安装客户端。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Vue](https://img.shields.io/badge/vue-3.x-brightgreen.svg)

---

## 为什么做这个？

在日常工作与生活中，我们经常需要在同一局域网内的不同设备之间互传文件——手机照片传到电脑、多人协作共享文档、跨操作系统快速传送大文件。

然而现有方案各有痛点：

| 方案 | 痛点 |
|------|------|
| 微信 / QQ 传文件 | 压缩图片质量、大文件限速、需要公网账号 |
| U 盘 / 移动硬盘 | 需要物理接触、传输速度受硬件限制 |
| 网盘（百度/阿里） | 限速严重、隐私风险、上传再下载浪费时间 |
| AirDrop | 仅限苹果设备 |
| SMB/FTP 共享 | 配置复杂、普通用户难以上手 |

**SendFile 的答案**：打开浏览器，扫个码，直接传。

---

## 为什么选择这套技术栈？

### 后端：Node.js + Express + WebSocket

- **零配置部署**：单个 `node server/index.js` 命令即可启动，跨平台（Windows / macOS / Linux）
- **WebSocket 实时推送**：设备上线/下线、文件列表变更、聊天消息，所有状态变化秒级同步到所有在线设备
- **分片上传架构**：将大文件切成 2MB 分片并发上传，突破内存限制，支持 500MB 超大文件
- **自动过期清理**：每小时自动清理 24 小时前上传且不在活跃会话中的文件

### 前端：Vue 3 + Element Plus + Vite

- **现代化构建**：Vite 提供极速的开发体验和优化的生产构建
- **组件化架构**：Vue 3 Composition API + `<script setup>`，代码结构清晰，易于维护
- **Element Plus**：提供完整的 PC 端与移动端组件（el-image 图片预览、el-drawer 底部抽屉、el-table 文件列表、el-pagination 分页等）
- **响应式设计**：深色模式自动跟随或手动切换，移动端友好

### 桌面端：Electron（可选）

- **一键打包**：运行 `npm run electron:dist` 即可生成 Windows NSIS 安装包
- **保留 Web 访问**：Electron 仅是壳，内嵌的 Express 服务依然对局域网开放，手机同样可以扫码访问
- **两种模式共存**：不想打包？直接 `node server/index.js`，局域网所有设备浏览器访问即可

---

## 功能全览

### 🌐 设备发现与连接
- **局域网自动发现**：上线后自动出现在同局域网所有 SendFile 用户的设备列表
- **PIN 码安全连接**：为本机设置 PIN，陌生设备需要输入正确 PIN 才能建立会话
- **多人群组会话**：支持 3 人以上同时在一个会话中共享文件（≥ 2 人配对后自动创建群组）
- **单会话限制**：每个设备同一时间只能加入一个群组，防止多组并发
- **设备状态**：在线 / 忙碌 / 离开，实时同步

### 📱 扫码传文件
- 电脑端点击「扫码连接」，手机扫描二维码即可直接访问 SendFile
- 移动端底部抽屉支持一键上线设备，无需手动输入 IP 地址

### 📤 强大的文件上传
- **拖拽上传**：支持文件和文件夹拖入上传区
- **粘贴上传**：支持 Ctrl+V 直接上传截图或复制的文件
- **分片上传**：2MB 分片 + 4 路并发，大文件高速稳定传输
- **断点续传**：上传中断后重新选择同一文件，自动跳过已上传分片
- **文件夹上传**：保留完整目录结构
- **上传进度广播**：上传进度实时推送给会话内所有成员

### 📥 灵活的文件管理与下载
- **在线预览**：图片、视频、音频、PDF、Word(.docx)、文本代码文件
- **图片全屏预览**：点击缩略图弹出全屏查看，支持左右切换、缩放（基于 Element Plus el-image 组件）
- **下载进度条**：大文件（≥5MB）下载时显示实时进度
- **拖拽排序**：会话中可手动拖拽调整文件显示顺序
- **文件分页**：文件多时自动分页显示，避免卡顿
- **批量下载**：多选文件，一键打包成 ZIP 下载
- **文件夹 ZIP 下载**：一键将整个文件夹打包下载
- **删除 / 重命名**：只能操作自己上传的文件
- **文件搜索**：会话内按文件名快速过滤
- **复制下载链接**：一键复制文件链接分享给局域网内其他人

### 💬 即时通讯
- **会话内聊天**：成员之间发送文字消息，消息气泡区分自己和他人
- **剪贴板快传**：一键发送文字/代码/链接给所有成员，接收方一键复制

### 🌐 国际化
- **中英文切换**：顶部栏一键切换简体中文 / English，所有界面文字即时生效
- **完整覆盖**：菜单、表格、按钮、对话框、通知、提示等全部静态文字均已双语化

### 🌙 体验优化
- **深色模式**：一键切换，设置自动记忆
- **桌面通知**：新文件 / 新消息收到时浏览器推送通知（可开关）
- **传输历史**：本地记录每次上传的文件信息（最多 200 条）
- **自动过期清理**：服务端每小时自动清理 24 小时前上传且不在活跃会话中的文件
- **移动端适配**：响应式布局 + 底部抽屉设置，手机浏览器操作友好
- **断线重连**：WebSocket 断开后自动重连，会话状态安全重置

---

## 快速上手

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0（或 yarn / pnpm）

### 安装依赖

```bash
npm install
```

### 方式一：Web 访问（推荐，局域网共享）

```bash
# 开发模式（自动重载）
npm run dev

# 或生产模式
npm run build
npm start
```

启动后终端会显示：

```
[*] SendFile Service Started
    Local: http://localhost:3000
    LAN:   http://192.168.x.x:3000
```

同局域网内的任意设备用浏览器打开上面的局域网地址即可使用。

> 端口 3000 占用时会自动递增，以终端实际输出为准。

### 方式二：Electron 桌面应用

```bash
# 开发模式（直接运行）
npm run electron

# 打包为安装程序（Windows）
npm run electron:dist
# 打包产物在 release/ 目录
```

> **注意**：首次运行 `electron:dist` 前，需要 `npm install`（会下载 Electron 二进制，约 100MB，需要网络）。

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式：同时启动后端和 Vite 前端 |
| `npm run dev:server` | 仅启动后端服务（nodemon 监听） |
| `npm run dev:web` | 仅启动 Vite 前端开发服务器 |
| `npm run build` | 构建前端生产版本到 `dist/` |
| `npm run preview` | 构建并启动生产服务（Express 托管 dist） |
| `npm start` | 启动生产服务（等同于 `node server/index.js`） |
| `npm run electron` | 开发模式启动 Electron 应用 |
| `npm run electron:pack` | 打包 Electron 为解包目录 |
| `npm run electron:dist` | 打包 Electron 为安装程序（NSIS） |

---

## 项目结构

```
sendfile/
├── server/
│   └── index.js          # Express + WebSocket 后端服务
├── electron/
│   └── main.js           # Electron 主进程入口
├── src/
│   ├── main.js           # Vue 应用入口
│   ├── App.vue           # 根组件
│   ├── style.css         # 全局样式
│   ├── api/              # API 请求层
│   │   ├── index.js      # axios 实例配置
│   │   ├── file.js       # 文件相关 API
│   │   └── session.js    # 会话相关 API
│   ├── components/       # 组件
│   │   ├── AppHeader.vue         # 顶部导航栏
│   │   ├── DevicePanel.vue       # 设备列表面板
│   │   ├── SessionLobby.vue      # 会话大厅
│   │   ├── FileManager.vue       # 文件管理器
│   │   ├── FileTable.vue         # 文件列表表格
│   │   ├── FolderBrowser.vue     # 文件夹浏览器
│   │   ├── UploadZone.vue        # 上传区域
│   │   ├── ChatDrawer.vue        # 聊天抽屉
│   │   ├── MobileSettings.vue    # 移动端设置
│   │   ├── DownloadProgress.vue  # 下载进度条
│   │   └── dialogs/              # 对话框组件
│   │       ├── ConnectDialog.vue     # 连接对话框
│   │       ├── JoinDialog.vue        # 加入会话对话框
│   │       ├── QrDialog.vue          # 二维码对话框
│   │       ├── PinDialog.vue         # PIN 码对话框
│   │       ├── HistoryDialog.vue     # 历史记录对话框
│   │       ├── PreviewDialog.vue     # 预览对话框
│   │       ├── ClipDialog.vue        # 剪贴板对话框
│   │       ├── ClipReceiveDialog.vue # 剪贴板接收对话框
│   │       ├── RenameDialog.vue      # 重命名对话框
│   │       └── WaitDialog.vue        # 等待对话框
│   ├── composables/      # 组合式函数
│   │   ├── useWebSocket.js      # WebSocket 连接管理
│   │   ├── useTheme.js          # 主题切换
│   │   ├── useNotification.js   # 桌面通知
│   │   ├── useTransferHistory.js # 传输历史
│   │   ├── useLanguage.js       # 多语言支持
│   │   └── useGuide.js          # 用户引导
│   ├── locales/          # 多语言翻译文件
│   │   ├── zh-CN.js             # 简体中文
│   │   └── en-US.js             # English
│   ├── constants/        # 常量配置
│   │   └── index.js
│   └── utils/            # 工具函数
│       ├── uuid.js       # UUID 生成
│       ├── fingerprint.js # 设备指纹
│       ├── format.js     # 格式化工具
│       ├── folder.js     # 文件夹处理
│       └── download.js   # 下载工具
├── uploads/              # 上传文件存储目录
│   └── .chunks/          # 分片临时目录（自动清理）
├── dist/                 # Vite 构建产物
├── release/              # Electron 打包产物
├── index.html            # Vite 入口 HTML
├── vite.config.js        # Vite 配置
├── package.json          # 项目配置
├── .env.development      # 开发环境变量
├── .env.production       # 生产环境变量
└── README.md             # 本文档
```

---

## 环境变量

项目支持通过 `.env` 文件配置环境变量：

### `.env.development`

```env
VITE_DEV_API_TARGET=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### `.env.production`

```env
VITE_API_BASE=/api
VITE_WS_URL=ws://localhost:3000
```

### 服务端环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `STRICT_PORT` | `false` | 是否严格使用指定端口（true 时端口占用会报错） |

---

## 技术架构

### 通信流程

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Device A  │◄──────────────────►│   Server    │
│  (Browser)  │                    │  (Express)  │
└─────────────┘                    └─────────────┘
       ▲                                  ▲
       │                                  │
       │          WebSocket               │
       └──────────────────────────────────┘
┌─────────────┐
│   Device B  │
│  (Browser)  │
└─────────────┘
```

### 文件上传流程

1. 前端计算文件 hash，检查是否已存在（断点续传）
2. 将文件切分为 2MB 的分片
3. 并发上传分片（默认 4 路并发）
4. 服务端接收分片并暂存
5. 所有分片上传完成后，发送合并请求
6. 服务端合并分片为完整文件
7. 广播文件列表更新给会话内所有成员

### 会话生命周期

1. **创建**：两个设备连接时自动创建会话
2. **加入**：第三方可申请加入，需群内成员同意
3. **维护**：实时同步成员状态、文件列表
4. **离开**：成员离开时更新状态，不足 2 人时自动解散

---

## 使用场景示例

### 场景 1：手机照片传电脑

1. 电脑启动 SendFile，手机扫描二维码打开页面
2. 手机点击底部浮动按钮打开设置抽屉，上线设备
3. 电脑端点击「连接」，两端建立会话
4. 手机选择照片上传，电脑直接下载

### 场景 2：多人协作传文件

1. 张三与李四建立一对一连接，自动创建群组
2. 王五在「加入会话」页面申请加入，成员同意即可
3. 任意成员可以上传文件，所有人可以下载
4. 会话内还能用聊天功能沟通

### 场景 3：传大文件断网重传

1. 开始上传 400MB 文件，传到一半网络中断
2. 重新连接后，再次选择同一文件上传
3. 系统自动识别已上传的分片，从中断处续传

### 场景 4：跨操作系统传输

1. Windows 电脑启动 SendFile
2. macOS / Linux / Android / iOS 设备浏览器访问局域网地址
3. 建立会话后直接传输文件，无需安装任何客户端

---

## 群组机制说明

- **创建规则**：群组由两个设备互连时自动创建（≥ 2 人），不支持单人创建空群
- **加入规则**：第三方可申请加入已有群组，需群内成员同意
- **单组限制**：每个设备同一时间只能在一个群组中，需先离开当前会话才能加入新群组
- **自动解散**：当群组成员不足 2 人时，会话自动关闭

---

## 安全说明

- SendFile 设计用于**受信任的局域网环境**（家庭、办公室、学校）
- 通过 PIN 码防止未授权设备接入
- 文件仅在局域网内传输，不经过任何外部服务器
- 建议不要在公共 WiFi 环境下使用
- 上传文件有大小限制（单文件 500MB，单次最多 500 个文件）
- 服务端每小时自动清理过期文件

---

## 常见问题

### Q: 端口被占用怎么办？

A: 默认情况下，端口占用时会自动递增（3000 → 3001 → 3002...）。如需固定端口，可设置环境变量 `STRICT_PORT=1`。

### Q: 如何修改默认端口？

A: 设置环境变量 `PORT=8080`，或在启动时指定：`PORT=8080 npm start`

### Q: 手机无法访问怎么办？

A: 确保手机和电脑在同一局域网内，检查防火墙设置是否允许该端口访问。

### Q: 文件上传失败？

A: 检查文件大小是否超过 500MB 限制，或单次上传文件数量是否超过 500 个。

### Q: 如何打包为桌面应用？

A: 运行 `npm run electron:dist`，打包产物在 `release/` 目录下。

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 开发规范

- 使用 Vue 3 Composition API + `<script setup>` 语法
- 组件命名采用 PascalCase
- 保持代码简洁，添加必要的注释
- 提交前运行 `npm run build` 确保构建通过

---

## 更新日志

### v2.1.0 (2026-06-25)

- 🌐 完整国际化支持：中英文一键切换，覆盖所有组件静态文字
- 🎨 头部导航栏重设计：SVG 渐变色 Logo、毛玻璃效果、Element Plus 组件风格
- 🎨 页面底部重设计：品牌信息 + 快速链接 + 版权信息三栏布局
- 🐛 修复文件表格操作列宽度不足导致改名/删除按钮被截断
- 🐛 修复成员列表过多时无法横向滚动的问题
- 🐛 修复文件列表过多时页面出现双滚动条的问题
- ✨ 文件表格设置最大高度，表头固定、表体内滚动
- ✨ 分页新增每页条数选择器（20/50/100）
- ✨ 会话大厅表格列宽优化，设备/PIN/操作列更合理
- ♻️ 移除面板标题中无意义的会话 ID 哈希值
- ♻️ 排序按钮改用 Element Plus el-button-group 组件
- ♻️ 所有原生 button 统一替换为 Element Plus el-button

### v2.0.0 (2026-06-23)

- 前端迁移为 Vue 3 + Vite + `<script setup>`
- 拆分组件化架构，代码结构更清晰
- 新增组合式函数：useWebSocket、useTheme、useNotification、useTransferHistory
- 新增 axios API 层，统一接口管理
- Vite 增加 `@` 路径别名、局域网开发 host、构建分包配置
- 开发模式同时启动后端和前端
- 增加环境变量配置

### v1.0.0 (初始版本)

- 基础文件传输功能
- WebSocket 实时通信
- 扫码连接
- 分片上传与断点续传

---

## License

MIT License

Copyright (c) 2026 SendFile

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
