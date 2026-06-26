'use strict';

const express = require('express');
const WebSocket = require('ws');
const ip = require('ip');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const archiver = require('archiver');
const mammoth = require('mammoth');
const qrcode = require('qrcode');

const app = express();
let PORT = Number(process.env.PORT || 3000);
const STRICT_PORT = process.env.STRICT_PORT === '1';
// __dirname 现在是 server/，uploads 在项目根目录
const ROOT_DIR = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const CHUNK_DIR = path.join(UPLOAD_DIR, '.chunks');
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 500;
const CHUNK_SIZE = 2 * 1024 * 1024;
const FILE_EXPIRE_MS = 24 * 60 * 60 * 1000;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(CHUNK_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));

// 生产模式：serve Vite 构建产物
const DIST_DIR = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

app.use('/files', express.static(UPLOAD_DIR));
app.get('/favicon.ico', (req, res) => res.status(204).end());

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}_${sanitizeName(file.originalname)}`)
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES_PER_UPLOAD }
});
const chunkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CHUNK_SIZE + 1024 }
});

const devices = new Map();
const pairRequests = new Map();
const joinRequests = new Map();
const deviceSession = new Map();
const sessions = new Map();
const chunkUploads = new Map();
const folderBatches = new Map();

function sanitizeName(name) {
  return String(name || 'file').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'file';
}
function createUuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
}
function resolveUploadPath(filePath) {
  const n = String(filePath || '').replace(/^\/files\//, '');
  if (!n || n.includes('..')) return null;
  const d = path.resolve(UPLOAD_DIR, n);
  return d.startsWith(path.resolve(UPLOAD_DIR)) ? d : null;
}
function normalizeIp(raw) {
  let ipAddr = String(raw || '');
  ipAddr = ipAddr.replace('::ffff:', '');
  if (ipAddr === '::1') ipAddr = '127.0.0.1';
  return ipAddr;
}
function sendTo(ipAddr, payload) {
  const d = devices.get(ipAddr);
  if (d && d.ws && d.ws.readyState === WebSocket.OPEN) d.ws.send(JSON.stringify(payload));
}
function isActiveSocket(ipAddr, ws) { return devices.get(ipAddr) && devices.get(ipAddr).ws === ws; }
function getDeviceName(ipAddr) { return (devices.get(ipAddr) && devices.get(ipAddr).name) || ipAddr; }
function getDeviceStatus(ipAddr) { return (devices.get(ipAddr) && devices.get(ipAddr).status) || 'online'; }
function publicDevice(d) {
  return { ip: d.ip, name: d.name, status: d.status, hasPin: Boolean(d.pin), inSession: deviceSession.has(d.ip) };
}
function makeDeviceName(rawName, ipAddr) {
  const base = String(rawName || '').trim() || ('设备 ' + ipAddr.split('.').pop());
  const used = new Set(Array.from(devices.values()).filter(d => d.ip !== ipAddr).map(d => d.name));
  if (!used.has(base)) return base;
  let i = 2; while (used.has(base + ' ' + i)) i++;
  return base + ' ' + i;
}
function sessionPayload(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return { id: s.id, members: Array.from(s.members).map(function (ip) { return { ip: ip, name: getDeviceName(ip), status: getDeviceStatus(ip) }; }), files: s.files };
}
function broadcastState() {
  const sessionList = Array.from(sessions.values()).map(function (s) {
    return { id: s.id, memberCount: s.members.size, members: Array.from(s.members).map(function (ip) { return { ip: ip, name: getDeviceName(ip), status: getDeviceStatus(ip) }; }) };
  });
  const radar = { onlineCount: devices.size, activeSessionCount: sessions.size, activeTransferCount: chunkUploads.size, devices: Array.from(devices.values()).map(publicDevice), sessions: sessionList };
  for (const v of devices.values()) {
    sendTo(v.ip, { type: 'DEVICE_LIST', list: Array.from(devices.values()).filter(function (d) { return d.ip !== v.ip && !deviceSession.has(d.ip); }).map(publicDevice) });
    sendTo(v.ip, { type: 'GROUP_LIST', list: sessionList });
    sendTo(v.ip, Object.assign({ type: 'RADAR_STATE' }, radar));
  }
}
function notifySession(sessionId, payload) {
  const s = sessions.get(sessionId);
  if (s) for (const ipAddr of s.members) sendTo(ipAddr, payload);
}
function createSession(memberIps) {
  const id = createUuid().slice(0, 8);
  sessions.set(id, { id: id, members: new Set(memberIps), files: [] });
  memberIps.forEach(function (ip) { deviceSession.set(ip, id); });
  const p = sessionPayload(id);
  memberIps.forEach(function (ip) { sendTo(ip, { type: 'SESSION_JOINED', session: p }); });
  broadcastState();
}
function closeSession(sessionId, message) {
  const s = sessions.get(sessionId); if (!s) return;
  for (const ipAddr of s.members) {
    deviceSession.delete(ipAddr);
    sendTo(ipAddr, { type: 'SESSION_CLOSED', message: message || '会话已结束' });
  }
  sessions.delete(sessionId); broadcastState();
}
function leaveSession(ipAddr, message) {
  const sessionId = deviceSession.get(ipAddr); if (!sessionId) return;
  const s = sessions.get(sessionId); deviceSession.delete(ipAddr); if (!s) return;
  s.members.delete(ipAddr);
  if (s.members.size <= 1) { closeSession(sessionId, '会话成员不足，连接已自动结束'); return; }
  notifySession(sessionId, { type: 'MEMBER_LEFT', memberIp: ipAddr, memberName: getDeviceName(ipAddr), message: message || (getDeviceName(ipAddr) + ' 已离开会话') });
  notifySession(sessionId, { type: 'SESSION_UPDATE', session: sessionPayload(sessionId) });
  broadcastState();
}
function clearPendingFor(ipAddr) {
  const t = pairRequests.get(ipAddr);
  if (t) { sendTo(t, { type: 'CONNECT_CANCELED', message: '对方已取消连接请求' }); pairRequests.delete(ipAddr); }
  for (const [rIp, tIp] of pairRequests.entries()) {
    if (tIp === ipAddr) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: '对方已离线，连接请求已取消' }); pairRequests.delete(rIp); }
  }
  for (const [rIp, pending] of joinRequests.entries()) {
    const s = sessions.get(pending.sessionId);
    if (rIp === ipAddr || (s && s.members.has(ipAddr))) {
      sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '入群请求已取消，请重试' }); joinRequests.delete(rIp);
    }
  }
}
function requireSession(sessionId, uploaderIp) {
  const s = sessions.get(String(sessionId || '').trim());
  const ipAddr = String(uploaderIp || '').trim();
  return (s && s.members.has(ipAddr)) ? s : null;
}

// 启动服务器（支持端口自动递增）
function startServer(port, originalPort = null) {
  const server = app.listen(port, function () {
    const addr = server.address();
    if (!addr) return;

    PORT = addr.port;
    const serverIp = normalizeIp(ip.address());

    if (originalPort !== null) {
      console.log('[*] Port ' + originalPort + ' is in use, using port ' + PORT + ' instead');
    }
    console.log('\n[*] SendFile Service Started');
    console.log('    Local: http://localhost:' + PORT);
    console.log('    LAN:   http://' + serverIp + ':' + PORT + '\n');

    const wss = new WebSocket.Server({ server: server });

    wss.on('connection', function (ws, req) {
      const clientIp = normalizeIp(req.socket.remoteAddress);
      ws.on('message', function (raw) {
        try { handleSocketMessage(ws, clientIp, JSON.parse(raw)); }
        catch (e) { sendTo(clientIp, { type: 'ERROR', message: '消息格式错误' }); }
      });
      ws.on('close', function () {
        if (devices.has(clientIp) && !isActiveSocket(clientIp, ws)) return;
        clearPendingFor(clientIp); leaveSession(clientIp, getDeviceName(clientIp) + ' 已断开连接');
        devices.delete(clientIp); broadcastState();
      });
    });

    Object.assign(module.exports, { server: server, port: PORT, wss: wss });
  });

  server.on('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      if (STRICT_PORT) {
        console.error('[Error] Port ' + port + ' is already in use. Stop the existing process or set PORT to another value.');
        process.exit(1);
      }
      const nextPort = port + 1;
      if (nextPort > 65535) {
        console.error('[Error] No available ports found (tried up to 65535)');
        process.exit(1);
      }
      server.close();
      startServer(nextPort, originalPort === null ? port : originalPort);
    } else {
      console.error('[Error] Server error:', err.message);
      process.exit(1);
    }
  });

  return server;
}

module.exports = { app: app };
const server = startServer(PORT);

function handleSocketMessage(ws, clientIp, msg) {
  switch (msg.type) {
    case 'ONLINE': {
      const name = makeDeviceName(msg.name, clientIp);
      devices.set(clientIp, { ip: clientIp, name: name, status: String(msg.status || 'online').trim() || 'online', pin: String(msg.pin || '').trim(), ws: ws });
      sendTo(clientIp, { type: 'MY_IP', ip: clientIp });
      sendTo(clientIp, { type: 'ONLINE_RESULT', success: true, assignedName: name, showToast: msg.showToast !== false });
      broadcastState(); break;
    }
    case 'UPDATE_STATUS': {
      const d = devices.get(clientIp); if (d) { d.status = String(msg.status || 'online').trim() || 'online'; broadcastState(); } break;
    }
    case 'CONNECT_REQ': {
      const targetIp = String(msg.targetIp || '').trim(); const target = devices.get(targetIp);
      if (!target) { sendTo(clientIp, { type: 'CONNECT_RESULT', allow: false, message: '目标设备不在线' }); return; }
      if (deviceSession.has(clientIp) || deviceSession.has(targetIp)) { sendTo(clientIp, { type: 'CONNECT_RESULT', allow: false, message: '设备已在其他会话中' }); return; }
      if (target.pin && target.pin !== String(msg.pin || '').trim()) { sendTo(clientIp, { type: 'PIN_ERROR', message: 'PIN 码错误，连接已被拦截' }); return; }
      pairRequests.set(clientIp, targetIp);
      sendTo(targetIp, { type: 'CONNECT_NOTIFY', fromIp: clientIp, fromName: getDeviceName(clientIp), timestamp: msg.timestamp || Date.now() }); break;
    }
    case 'CONNECT_RES': {
      const rIp = String(msg.toIp || '').trim();
      if (pairRequests.get(rIp) !== clientIp) return; pairRequests.delete(rIp);
      if (!msg.allow) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: msg.message || '对方拒绝了连接' }); return; }
      if (deviceSession.has(clientIp) || deviceSession.has(rIp)) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: '设备已在其他会话中' }); return; }
      createSession([clientIp, rIp]); break;
    }
    case 'CONNECT_CANCEL': {
      const tIp = String(msg.targetIp || '').trim();
      if (pairRequests.get(clientIp) === tIp) pairRequests.delete(clientIp);
      sendTo(tIp, { type: 'CONNECT_CANCELED', message: msg.message || '对方已取消连接请求' }); break;
    }
    case 'GROUP_JOIN_REQ': {
      const gId = String(msg.groupId || '').trim(); const s = sessions.get(gId);
      if (deviceSession.has(clientIp)) { sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '你已经在会话中' }); return; }
      if (!s || s.members.size < 2) { sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '目标群组不存在或已失效' }); return; }
      joinRequests.set(clientIp, { sessionId: gId, resolved: false });
      for (const mIp of s.members) sendTo(mIp, { type: 'GROUP_JOIN_NOTIFY', requesterIp: clientIp, requesterName: getDeviceName(clientIp), groupId: gId });
      sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: true, pending: true, message: '已发送入群申请，等待成员确认' }); break;
    }
    case 'GROUP_JOIN_RES': {
      const rIp = String(msg.requesterIp || '').trim(); const gId = String(msg.groupId || '').trim();
      const pending = joinRequests.get(rIp); const s = sessions.get(gId);
      if (!pending || pending.sessionId !== gId || pending.resolved || !s || !s.members.has(clientIp)) return;
      if (!msg.allow) { joinRequests.delete(rIp); sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: getDeviceName(clientIp) + ' 拒绝了你的入群申请' }); return; }
      pending.resolved = true; joinRequests.delete(rIp);
      if (deviceSession.has(rIp)) { sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '你已经加入其他会话' }); return; }
      s.members.add(rIp); deviceSession.set(rIp, gId);
      const p = sessionPayload(gId);
      notifySession(gId, { type: 'SESSION_JOINED', session: p });
      notifySession(gId, { type: 'MEMBER_JOINED', memberIp: rIp, memberName: getDeviceName(rIp), message: getDeviceName(rIp) + ' 已加入会话' });
      broadcastState(); break;
    }
    case 'PING':
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PONG', t: msg.t })); break;
    case 'DISCONNECT': leaveSession(clientIp, msg.message || (getDeviceName(clientIp) + ' 已离开会话')); break;
    case 'OFFLINE':
      if (!isActiveSocket(clientIp, ws)) return;
      clearPendingFor(clientIp); leaveSession(clientIp, getDeviceName(clientIp) + ' 已下线'); devices.delete(clientIp);
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'OFFLINE_RESULT', success: true }));
      broadcastState(); break;
    case 'CHAT_MSG': {
      const sid = deviceSession.get(clientIp); if (!sid) return;
      const content = String(msg.content || '').trim().slice(0, 2000); if (!content) return;
      notifySession(sid, { type: 'CHAT_MSG', fromIp: clientIp, fromName: getDeviceName(clientIp), content: content, timestamp: Date.now() }); break;
    }
    case 'CLIP_SHARE': {
      const sid = deviceSession.get(clientIp); if (!sid) return;
      const content = String(msg.content || '').trim().slice(0, 50000); if (!content) return;
      notifySession(sid, { type: 'CLIP_SHARE', fromIp: clientIp, fromName: getDeviceName(clientIp), content: content, timestamp: Date.now() }); break;
    }
    // 分页查询
    case 'GET_DEVICES': {
      const dPage = Math.max(1, Number(msg.page) || 1);
      const dSize = Math.min(100, Math.max(1, Number(msg.pageSize) || 10));
      const all = Array.from(devices.values()).filter(function (d) { return d.ip !== clientIp && !deviceSession.has(d.ip); }).map(publicDevice);
      const dItems = all.slice((dPage - 1) * dSize, dPage * dSize);
      sendTo(clientIp, { type: 'DEVICES_PAGE', items: dItems, total: all.length, page: dPage, pageSize: dSize }); break;
    }
    case 'GET_GROUPS': {
      const gPage = Math.max(1, Number(msg.page) || 1);
      const gSize = Math.min(100, Math.max(1, Number(msg.pageSize) || 10));
      const allGroups = Array.from(sessions.values()).map(function (s) {
        return { id: s.id, memberCount: s.members.size, members: Array.from(s.members).map(function (ip) { return { ip: ip, name: getDeviceName(ip), status: getDeviceStatus(ip) }; }) };
      });
      const gItems = allGroups.slice((gPage - 1) * gSize, gPage * gSize);
      sendTo(clientIp, { type: 'GROUPS_PAGE', items: gItems, total: allGroups.length, page: gPage, pageSize: gSize }); break;
    }
    case 'GET_RADAR': {
      const rPage = Math.max(1, Number(msg.page) || 1);
      const rSize = Math.min(100, Math.max(1, Number(msg.pageSize) || 10));
      const allDevices = Array.from(devices.values()).map(publicDevice);
      const rItems = allDevices.slice((rPage - 1) * rSize, rPage * rSize);
      sendTo(clientIp, { type: 'RADAR_PAGE', items: rItems, total: allDevices.length, page: rPage, pageSize: rSize, onlineCount: devices.size, activeSessionCount: sessions.size, activeTransferCount: chunkUploads.size }); break;
    }
    default: break;
  }
}

// QR code
app.get('/qrcode', async function (req, res) {
  try {
    let serverIp = normalizeIp(ip.address());
    // 优先使用 IPv4 地址，避免 IPv6 导致手机无法访问
    if (serverIp.includes(':')) {
      try {
        const interfaces = require('os').networkInterfaces();
        outer:
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              serverIp = iface.address;
              break outer;
            }
          }
        }
      } catch (e) { /* 忽略 */ }
    }
    const url = 'http://' + serverIp + ':' + PORT;
    const dataUrl = await qrcode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'L' });
    res.json({ url: url, dataUrl: dataUrl });
  } catch (e) { res.status(500).json({ error: 'QR code error: ' + e.message }); }
});

// Resume upload
app.get('/upload-status', function (req, res) {
  const uploadId = String(req.query.uploadId || '').trim();
  if (!uploadId || uploadId.includes('..')) return res.json({ chunks: [] });
  const dir = path.join(CHUNK_DIR, uploadId);
  if (!fs.existsSync(dir)) return res.json({ chunks: [] });
  try {
    const chunks = fs.readdirSync(dir).filter(function (f) { return f.endsWith('.part'); }).map(function (f) { return parseInt(f, 10); }).filter(function (n) { return !isNaN(n); });
    res.json({ chunks: chunks });
  } catch (e) { res.json({ chunks: [] }); }
});

// 普通上传
app.post('/upload', upload.any(), function (req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = normalizeIp(req.ip);
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '会话已失效，请重新连接' });
    for (const file of req.files || []) {
      session.files.push({ kind: 'file', name: file.originalname, path: '/files/' + file.filename, ip: uploaderIp, uploaderName: getDeviceName(uploaderIp), size: file.size, fileType: file.mimetype || '', time: new Date().toISOString(), uploadedAt: Date.now() });
    }
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: '上传失败' }); }
});

// 分片上传（含进度广播）
app.post('/upload-chunk', chunkUpload.single('chunk'), function (req, res) {
  try {
    const uploadId = String(req.body.uploadId || '').trim();
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = normalizeIp(req.ip);
    const chunkIndex = Number(req.body.chunkIndex);
    const totalChunks = Number(req.body.totalChunks);
    if (!requireSession(sessionId, uploaderIp)) return res.status(400).json({ success: false, message: '会话已失效，请重新连接' });
    if (!req.file || !uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks <= 0) return res.status(400).json({ success: false, message: '分片参数无效' });
    if (!chunkUploads.has(uploadId)) {
      chunkUploads.set(uploadId, { sessionId: sessionId, uploaderIp: uploaderIp, fileName: String(req.body.fileName || 'file'), relativePath: String(req.body.relativePath || req.body.fileName || 'file'), fileSize: Number(req.body.fileSize || 0), fileType: String(req.body.fileType || ''), totalChunks: totalChunks, createdAt: Date.now() });
      fs.mkdirSync(path.join(CHUNK_DIR, uploadId), { recursive: true });
    }
    fs.writeFileSync(path.join(CHUNK_DIR, uploadId, chunkIndex + '.part'), req.file.buffer);
    const meta = chunkUploads.get(uploadId);
    if (meta) {
      try {
        const done = fs.readdirSync(path.join(CHUNK_DIR, uploadId)).filter(function (f) { return f.endsWith('.part'); }).length;
        notifySession(sessionId, { type: 'UPLOAD_PROGRESS', uploadId: uploadId, uploaderIp: uploaderIp, uploaderName: getDeviceName(uploaderIp), fileName: meta.fileName, progress: Math.min(99, Math.round(done / meta.totalChunks * 100)) });
      } catch (e) { }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: '分片上传失败' }); }
});

// 开始文件夹批次
app.post('/begin-folder-batch', function (req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = normalizeIp(req.ip);
    const batchId = String(req.body.batchId || '').trim();
    const rootName = sanitizeName(req.body.rootName);
    const fileCount = Number(req.body.fileCount);
    if (!requireSession(sessionId, uploaderIp)) return res.status(400).json({ success: false, message: '会话已失效，请重新连接' });
    if (!batchId || !rootName || !Number.isInteger(fileCount) || fileCount <= 0) return res.status(400).json({ success: false, message: '文件夹批次参数无效' });
    if (folderBatches.has(batchId)) return res.status(400).json({ success: false, message: '文件夹批次已存在' });
    folderBatches.set(batchId, { sessionId: sessionId, uploaderIp: uploaderIp, rootName: rootName, fileCount: fileCount, files: [], createdAt: Date.now() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: '创建文件夹批次失败' }); }
});

// Upload complete (merge chunks)
app.post('/upload-complete', async function (req, res) {
  let tmpPath = null;
  try {
    const uploadId = String(req.body.uploadId || '').trim();
    const folderBatchId = String(req.body.folderBatchId || '').trim();
    const meta = chunkUploads.get(uploadId);
    if (!meta) return res.status(400).json({ success: false, message: '上传任务不存在' });
    const session = requireSession(meta.sessionId, meta.uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '会话已失效，请重新连接' });

    for (let i = 0; i < meta.totalChunks; i++) {
      if (!fs.existsSync(path.join(CHUNK_DIR, uploadId, i + '.part')))
        return res.status(400).json({ success: false, message: '分片缺失，无法合并' });
    }

    const mergedName = Date.now() + '_' + sanitizeName(meta.fileName);
    const mergedPath = path.join(UPLOAD_DIR, mergedName);
    tmpPath = mergedPath + '.tmp';
    const out = fs.createWriteStream(tmpPath);
    for (let i = 0; i < meta.totalChunks; i++) {
      const cp = path.join(CHUNK_DIR, uploadId, i + '.part');
      await new Promise(function (resolve, reject) {
        const rs = fs.createReadStream(cp);
        rs.on('error', reject);
        rs.on('end', resolve);
        rs.pipe(out, { end: false });
      });
    }
    await new Promise(function (resolve, reject) {
      out.on('error', reject);
      out.on('finish', resolve);
      out.end();
    });

    fs.renameSync(tmpPath, mergedPath);
    tmpPath = null;

    fs.rmSync(path.join(CHUNK_DIR, uploadId), { recursive: true, force: true });
    chunkUploads.delete(uploadId);
    notifySession(meta.sessionId, { type: 'UPLOAD_PROGRESS', uploadId: uploadId, uploaderIp: meta.uploaderIp, uploaderName: getDeviceName(meta.uploaderIp), fileName: meta.fileName, progress: 100, done: true });
    if (folderBatchId) {
      const batch = folderBatches.get(folderBatchId);
      if (!batch || batch.sessionId !== meta.sessionId || batch.uploaderIp !== meta.uploaderIp) return res.status(400).json({ success: false, message: '文件夹批次无效或已过期' });
      let relPath = String(meta.relativePath || meta.fileName).replace(/\\/g, '/');
      const rp = batch.rootName + '/';
      if (relPath.startsWith(rp)) relPath = relPath.slice(rp.length);
      if (!relPath || relPath === batch.rootName) relPath = path.basename(meta.fileName) || 'file';
      batch.files.push({ relPath: relPath, path: '/files/' + mergedName, size: meta.fileSize || 0, fileType: meta.fileType || '' });
      if (batch.files.length === batch.fileCount) {
        session.files.push({ kind: 'folder', id: folderBatchId, name: batch.rootName, ip: batch.uploaderIp, uploaderName: getDeviceName(batch.uploaderIp), time: new Date().toISOString(), uploadedAt: Date.now(), items: batch.files.slice() });
        folderBatches.delete(folderBatchId);
        notifySession(meta.sessionId, { type: 'FILE_LIST', list: session.files });
      }
      broadcastState(); return res.json({ success: true });
    }
    session.files.push({ kind: 'file', name: meta.relativePath || meta.fileName, path: '/files/' + mergedName, ip: meta.uploaderIp, uploaderName: getDeviceName(meta.uploaderIp), size: meta.fileSize || 0, fileType: meta.fileType || '', time: new Date().toISOString(), uploadedAt: Date.now() });
    notifySession(meta.sessionId, { type: 'FILE_LIST', list: session.files });
    broadcastState(); res.json({ success: true });
  } catch (e) {
    if (tmpPath) try { fs.unlinkSync(tmpPath); } catch (e2) { }
    res.status(500).json({ success: false, message: '文件合并失败' });
  }
});

// 删除文件
app.post('/delete-file', function (req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = normalizeIp(req.ip);
    const filePath = String(req.body.filePath || '').trim();
    const fileId = String(req.body.fileId || '').trim();
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '会话已失效' });
    const idx = session.files.findIndex(function (f) { return (fileId && f.id === fileId) || (filePath && f.path === filePath); });
    if (idx === -1) return res.status(404).json({ success: false, message: '文件不存在' });
    const file = session.files[idx];
    if (file.ip !== uploaderIp) return res.status(403).json({ success: false, message: '只能删除自己上传的文件' });
    session.files.splice(idx, 1);
    if (file.kind === 'file' && file.path) { const dp = resolveUploadPath(file.path); if (dp) try { fs.unlinkSync(dp); } catch (e) { } }
    else if (file.kind === 'folder' && file.items) { file.items.forEach(function (item) { const dp = resolveUploadPath(item.path); if (dp) try { fs.unlinkSync(dp); } catch (e) { } }); }
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: '删除失败' }); }
});

// 重命名文件
app.post('/rename-file', function (req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = normalizeIp(req.ip);
    const filePath = String(req.body.filePath || '').trim();
    const fileId = String(req.body.fileId || '').trim();
    const newName = sanitizeName(String(req.body.newName || '').trim());
    if (!newName) return res.status(400).json({ success: false, message: '文件名不能为空' });
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '会话已失效' });
    const file = session.files.find(function (f) { return (fileId && f.id === fileId) || (filePath && f.path === filePath); });
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });
    if (file.ip !== uploaderIp) return res.status(403).json({ success: false, message: '只能重命名自己上传的文件' });
    file.name = newName;
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: '重命名失败' }); }
});

// Batch ZIP download
app.post('/batch-download-zip', function (req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const rIp = normalizeIp(req.ip);
    const fileKeys = Array.isArray(req.body.fileKeys) ? req.body.fileKeys.map(String) : [];
    const session = requireSession(sessionId, rIp);
    if (!session) return res.status(403).send('无权下载');
    if (!fileKeys.length) return res.status(400).send('未选择文件');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sendfile_batch_' + Date.now() + '.zip"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', function () { if (!res.headersSent) res.status(500).end(); });
    archive.pipe(res);
    for (const file of session.files) {
      const key = file.path || file.id; if (!fileKeys.includes(key)) continue;
      if (file.kind === 'file' && file.path) { const dp = resolveUploadPath(file.path); if (dp && fs.existsSync(dp)) archive.file(dp, { name: file.name || path.basename(dp) }); }
      else if (file.kind === 'folder' && file.items) { file.items.forEach(function (item) { const dp = resolveUploadPath(item.path); if (dp && fs.existsSync(dp)) archive.file(dp, { name: file.name + '/' + item.relPath }); }); }
    }
    archive.finalize();
  } catch (e) { if (!res.headersSent) res.status(500).send('打包失败'); }
});

// Folder ZIP download
app.get('/download-folder-zip', function (req, res) {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    const folderId = String(req.query.folderId || '').trim();
    const rIp = normalizeIp(req.ip);
    const session = requireSession(sessionId, rIp);
    if (!session) return res.status(403).send('无权下载');
    const entry = session.files.find(function (f) { return f.kind === 'folder' && f.id === folderId; });
    if (!entry || !entry.items || !entry.items.length) return res.status(404).send('文件夹不存在');
    const zipName = sanitizeName(entry.name) + '.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(zipName) + '"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', function () { if (!res.headersSent) res.status(500).end(); });
    archive.pipe(res);
    for (const item of entry.items) {
      const n = String(item.path || '').replace(/^\/files\//, ''); if (!n) continue;
      const dp = path.join(UPLOAD_DIR, n);
      if (dp.startsWith(UPLOAD_DIR) && fs.existsSync(dp)) archive.file(dp, { name: String(item.relPath || path.basename(n)).replace(/\\/g, '/') });
    }
    archive.finalize();
  } catch (e) { if (!res.headersSent) res.status(500).send('打包失败'); }
});

// Word preview
app.get('/preview/docx', async function (req, res) {
  try {
    const dp = resolveUploadPath(req.query.path);
    if (!dp || !fs.existsSync(dp)) return res.status(404).send('文件不存在');
    const result = await mammoth.convertToHtml({ path: dp });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{margin:0;padding:24px;color:#172033;font:15px/1.7 "Microsoft YaHei",Arial,sans-serif;background:#fff}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d9e1ec;padding:6px 8px}</style></head><body>' + (result.value || '<p>文档没有可预览内容</p>') + '</body></html>');
  } catch (e) { res.status(500).send('Word 文档预览失败'); }
});

// 生产模式 fallback：所有未匹配路由返回 index.html（SPA history 模式）
if (fs.existsSync(DIST_DIR)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    } else {
      next();
    }
  });
}

// Error handler
app.use(function (err, req, res, next) {
  if (!(err instanceof multer.MulterError)) return next(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: '单个文件不能超过 ' + Math.floor(MAX_FILE_SIZE / 1024 / 1024) + 'MB' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(413).json({ success: false, message: '单次上传文件数量不能超过 ' + MAX_FILES_PER_UPLOAD + ' 个' });
  return res.status(413).json({ success: false, message: '上传文件不符合限制条件' });
});

// 自动清理过期文件（每小时执行一次）
setInterval(function () {
  try {
    const now = Date.now();
    const inUse = new Set();
    for (const s of sessions.values()) {
      for (const f of s.files) {
        if (f.path) inUse.add(f.path.replace('/files/', ''));
        if (f.items) f.items.forEach(function (item) { if (item.path) inUse.add(item.path.replace('/files/', '')); });
      }
    }
    const files = fs.readdirSync(UPLOAD_DIR).filter(function (f) { return !f.startsWith('.'); });
    for (const f of files) {
      if (inUse.has(f)) continue;
      const fp = path.join(UPLOAD_DIR, f);
      try { if (now - fs.statSync(fp).mtimeMs > FILE_EXPIRE_MS) fs.unlinkSync(fp); } catch (e) { }
    }
  } catch (e) { }
}, 60 * 60 * 1000);

// 孤立分片超时清理（2小时未完成的任务）
const CHUNK_EXPIRE_MS = 2 * 60 * 60 * 1000;
setInterval(function () {
  try {
    const now = Date.now();
    for (const [uploadId, meta] of chunkUploads.entries()) {
      if (meta.createdAt && now - meta.createdAt > CHUNK_EXPIRE_MS) {
        chunkUploads.delete(uploadId);
        try { fs.rmSync(path.join(CHUNK_DIR, uploadId), { recursive: true, force: true }); } catch (e) { }
      }
    }
    for (const [batchId, batch] of folderBatches.entries()) {
      if (batch.createdAt && now - batch.createdAt > CHUNK_EXPIRE_MS) {
        folderBatches.delete(batchId);
      }
    }
    if (fs.existsSync(CHUNK_DIR)) {
      const dirs = fs.readdirSync(CHUNK_DIR);
      for (const dir of dirs) {
        if (chunkUploads.has(dir)) continue;
        const dp = path.join(CHUNK_DIR, dir);
        try {
          const stat = fs.statSync(dp);
          if (stat.isDirectory() && now - stat.mtimeMs > CHUNK_EXPIRE_MS) {
            fs.rmSync(dp, { recursive: true, force: true });
          }
        } catch (e) { }
      }
    }
  } catch (e) { }
}, 30 * 60 * 1000);
