# SendFile 重构记录与待办

> 更新时间：2026-06-23  
> 基准页面：`index.html.bak` 保留不动，Vue3 版本复刻其功能和样式。

## 已完成

- 保留 `index.html.bak` 作为原始完整页面备份。
- 删除根目录旧入口：`server.js`、`main.js`、`start.ps1`。
- 将前端迁移为 Vue3 + Vite + `<script setup>`。
- 拆分组件：
  - `components/AppHeader.vue`
  - `components/DevicePanel.vue`
  - `components/SessionLobby.vue`
  - `components/FileManager.vue`
  - `components/FileTable.vue`
  - `components/FolderBrowser.vue`
  - `components/UploadZone.vue`
  - `components/ChatDrawer.vue`
  - `components/MobileSettings.vue`
  - `components/dialogs/*`
- 新增组合式函数：
  - `useWebSocket`
  - `useTheme`
  - `useNotification`
  - `useTransferHistory`
- 新增 axios API 层：
  - `api/index.js`
  - `api/file.js`
  - `api/session.js`
- 新增工具与常量：
  - `constants/index.js`
  - `utils/uuid.js`
  - `utils/fingerprint.js`
  - `utils/format.js`
  - `utils/folder.js`
  - `utils/download.js`
- Vite 增加 `@` 路径别名、局域网开发 host、构建分包配置。
- 增加 `.env.development` / `.env.production`，预留 `VITE_API_BASE`、`VITE_WS_URL`。
- `npm run dev` 一行同时启动后端和前端。
- 开发模式后端固定使用 3001，Vite 代理和 WebSocket 一起指向 3001，避免当前机器已有旧 Node 占用 3000 时连错服务。
- `npm run electron:pack` / `npm run electron:dist` 一行先构建前端再打包 Electron。

## 常用命令

```bash
npm run dev
```

开发模式：同时启动 `server/index.js` 和 Vite。

```bash
npm run build
npm run preview
```

生产模式：构建前端，并由 Express 托管 `dist`。

```bash
npm run electron:pack
npm run electron:dist
```

Electron 打包：`electron:pack` 生成解包目录，`electron:dist` 生成安装包。

## 已自测

- `npm run build` 通过。
- `node --check server/index.js` 通过。
- `node --check electron/main.js` 通过。
- 启动生产服务后访问 `http://localhost:3000/` 返回 200。
- `/qrcode` 返回二维码 JSON 数据。
- `npm run electron:pack` 通过，生成 `release/win-unpacked/SendFile.exe`。

## 注意事项

- 当前机器上 3000 端口被 PID 4420 占用且无法由当前会话停止，所以开发命令改用 3001。
- 生产启动 `npm run start` 和 Electron 仍保留端口自动递增能力。

## 后续可选优化

- Element Plus 构建 chunk 较大，后续可按路由或弹窗做动态导入。
- 后端 `server/index.js` 仍是单文件，可继续拆分为 routes、ws、utils、config。
- 可以补 ESLint / Prettier，统一格式检查。
- 可以继续引入 TypeScript 或 JSDoc 类型声明，增强 API 与 WebSocket 消息类型约束。
