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
const PORT = Number(process.env.PORT || 3000);
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const CHUNK_DIR = path.join(UPLOAD_DIR, '.chunks');
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 500;
const CHUNK_SIZE = 2 * 1024 * 1024;
const FILE_EXPIRE_MS = 24 * 60 * 60 * 1000;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(CHUNK_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));
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
  return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`;
}
function resolveUploadPath(filePath) {
  const n = String(filePath || '').replace(/^\/files\//, '');
  if (!n || n.includes('..')) return null;
  const d = path.resolve(UPLOAD_DIR, n);
  return d.startsWith(path.resolve(UPLOAD_DIR)) ? d : null;
}
function normalizeIp(raw) { return String(raw || '').replace('::ffff:', ''); }
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
  const base = String(rawName || '').trim() || ('\u8bbe\u5907 ' + ipAddr.split('.').pop());
  const used = new Set(Array.from(devices.values()).filter(d => d.ip !== ipAddr).map(d => d.name));
  if (!used.has(base)) return base;
  let i = 2; while (used.has(base + ' ' + i)) i++;
  return base + ' ' + i;
}
function sessionPayload(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return { id: s.id, members: Array.from(s.members).map(function(ip) { return { ip: ip, name: getDeviceName(ip), status: getDeviceStatus(ip) }; }), files: s.files };
}
function broadcastState() {
  const sessionList = Array.from(sessions.values()).map(function(s) {
    return { id: s.id, memberCount: s.members.size, members: Array.from(s.members).map(function(ip) { return { ip: ip, name: getDeviceName(ip), status: getDeviceStatus(ip) }; }) };
  });
  const radar = { onlineCount: devices.size, activeSessionCount: sessions.size, activeTransferCount: chunkUploads.size, devices: Array.from(devices.values()).map(publicDevice), sessions: sessionList };
  for (const v of devices.values()) {
    sendTo(v.ip, { type: 'DEVICE_LIST', list: Array.from(devices.values()).filter(function(d) { return d.ip !== v.ip && !deviceSession.has(d.ip); }).map(publicDevice) });
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
  memberIps.forEach(function(ip) { deviceSession.set(ip, id); });
  const p = sessionPayload(id);
  memberIps.forEach(function(ip) { sendTo(ip, { type: 'SESSION_JOINED', session: p }); });
  broadcastState();
}
function closeSession(sessionId, message) {
  const s = sessions.get(sessionId); if (!s) return;
  for (const ipAddr of s.members) {
    deviceSession.delete(ipAddr);
    sendTo(ipAddr, { type: 'SESSION_CLOSED', message: message || '\u4f1a\u8bdd\u5df2\u7ed3\u675f' });
  }
  sessions.delete(sessionId); broadcastState();
}
function leaveSession(ipAddr, message) {
  const sessionId = deviceSession.get(ipAddr); if (!sessionId) return;
  const s = sessions.get(sessionId); deviceSession.delete(ipAddr); if (!s) return;
  s.members.delete(ipAddr);
  if (s.members.size <= 1) { closeSession(sessionId, '\u4f1a\u8bdd\u6210\u5458\u4e0d\u8db3\uff0c\u8fde\u63a5\u5df2\u81ea\u52a8\u7ed3\u675f'); return; }
  notifySession(sessionId, { type: 'MEMBER_LEFT', memberIp: ipAddr, memberName: getDeviceName(ipAddr), message: message || (getDeviceName(ipAddr) + ' \u5df2\u79bb\u5f00\u4f1a\u8bdd') });
  notifySession(sessionId, { type: 'SESSION_UPDATE', session: sessionPayload(sessionId) });
  broadcastState();
}
function clearPendingFor(ipAddr) {
  const t = pairRequests.get(ipAddr);
  if (t) { sendTo(t, { type: 'CONNECT_CANCELED', message: '\u5bf9\u65b9\u5df2\u53d6\u6d88\u8fde\u63a5\u8bf7\u6c42' }); pairRequests.delete(ipAddr); }
  for (const [rIp, tIp] of pairRequests.entries()) {
    if (tIp === ipAddr) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: '\u5bf9\u65b9\u5df2\u79bb\u7ebf\uff0c\u8fde\u63a5\u8bf7\u6c42\u5df2\u53d6\u6d88' }); pairRequests.delete(rIp); }
  }
  for (const [rIp, pending] of joinRequests.entries()) {
    const s = sessions.get(pending.sessionId);
    if (rIp === ipAddr || (s && s.members.has(ipAddr))) {
      sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '\u5165\u7fa4\u8bf7\u6c42\u5df2\u53d6\u6d88\uff0c\u8bf7\u91cd\u8bd5' }); joinRequests.delete(rIp);
    }
  }
}
function requireSession(sessionId, uploaderIp) {
  const s = sessions.get(String(sessionId || '').trim());
  const ipAddr = String(uploaderIp || '').trim();
  return (s && s.members.has(ipAddr)) ? s : null;
}

const server = app.listen(PORT, function() {
  console.log('\n\ud83d\ude80 SendFile \u670d\u52a1\u5df2\u542f\u52a8');
  console.log('   \u672c\u673a\u8bbf\u95ee: http://localhost:' + PORT);
  console.log('   \u5c40\u57df\u7f51:   http://' + ip.address() + ':' + PORT + '\n');
});
const wss = new WebSocket.Server({ server: server });

wss.on('connection', function(ws, req) {
  const clientIp = normalizeIp(req.socket.remoteAddress);
  ws.on('message', function(raw) {
    try { handleSocketMessage(ws, clientIp, JSON.parse(raw)); }
    catch(e) { sendTo(clientIp, { type: 'ERROR', message: '\u6d88\u606f\u683c\u5f0f\u9519\u8bef' }); }
  });
  ws.on('close', function() {
    if (devices.has(clientIp) && !isActiveSocket(clientIp, ws)) return;
    clearPendingFor(clientIp); leaveSession(clientIp, getDeviceName(clientIp) + ' \u5df2\u65ad\u5f00\u8fde\u63a5');
    devices.delete(clientIp); broadcastState();
  });
});

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
      if (!target) { sendTo(clientIp, { type: 'CONNECT_RESULT', allow: false, message: '\u76ee\u6807\u8bbe\u5907\u4e0d\u5728\u7ebf' }); return; }
      if (deviceSession.has(clientIp) || deviceSession.has(targetIp)) { sendTo(clientIp, { type: 'CONNECT_RESULT', allow: false, message: '\u8bbe\u5907\u5df2\u5728\u5176\u4ed6\u4f1a\u8bdd\u4e2d' }); return; }
      if (target.pin && target.pin !== String(msg.pin || '').trim()) { sendTo(clientIp, { type: 'PIN_ERROR', message: 'PIN \u7801\u9519\u8bef\uff0c\u8fde\u63a5\u5df2\u88ab\u62e6\u622a' }); return; }
      pairRequests.set(clientIp, targetIp);
      sendTo(targetIp, { type: 'CONNECT_NOTIFY', fromIp: clientIp, fromName: getDeviceName(clientIp), timestamp: msg.timestamp || Date.now() }); break;
    }
    case 'CONNECT_RES': {
      const rIp = String(msg.toIp || '').trim();
      if (pairRequests.get(rIp) !== clientIp) return; pairRequests.delete(rIp);
      if (!msg.allow) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: msg.message || '\u5bf9\u65b9\u62d2\u7edd\u4e86\u8fde\u63a5' }); return; }
      if (deviceSession.has(clientIp) || deviceSession.has(rIp)) { sendTo(rIp, { type: 'CONNECT_RESULT', allow: false, message: '\u8bbe\u5907\u5df2\u5728\u5176\u4ed6\u4f1a\u8bdd\u4e2d' }); return; }
      createSession([clientIp, rIp]); break;
    }
    case 'CONNECT_CANCEL': {
      const tIp = String(msg.targetIp || '').trim();
      if (pairRequests.get(clientIp) === tIp) pairRequests.delete(clientIp);
      sendTo(tIp, { type: 'CONNECT_CANCELED', message: msg.message || '\u5bf9\u65b9\u5df2\u53d6\u6d88\u8fde\u63a5\u8bf7\u6c42' }); break;
    }
    case 'GROUP_JOIN_REQ': {
      const gId = String(msg.groupId || '').trim(); const s = sessions.get(gId);
      if (deviceSession.has(clientIp)) { sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '\u4f60\u5df2\u7ecf\u5728\u4f1a\u8bdd\u4e2d' }); return; }
      if (!s || s.members.size < 2) { sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '\u76ee\u6807\u7fa4\u7ec4\u4e0d\u5b58\u5728\u6216\u5df2\u5931\u6548' }); return; }
      joinRequests.set(clientIp, { sessionId: gId, resolved: false });
      for (const mIp of s.members) sendTo(mIp, { type: 'GROUP_JOIN_NOTIFY', requesterIp: clientIp, requesterName: getDeviceName(clientIp), groupId: gId });
      sendTo(clientIp, { type: 'GROUP_JOIN_RESULT', success: true, pending: true, message: '\u5df2\u53d1\u9001\u5165\u7fa4\u7533\u8bf7\uff0c\u7b49\u5f85\u6210\u5458\u786e\u8ba4' }); break;
    }
    case 'GROUP_JOIN_RES': {
      const rIp = String(msg.requesterIp || '').trim(); const gId = String(msg.groupId || '').trim();
      const pending = joinRequests.get(rIp); const s = sessions.get(gId);
      if (!pending || pending.sessionId !== gId || pending.resolved || !s || !s.members.has(clientIp)) return;
      if (!msg.allow) { joinRequests.delete(rIp); sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: getDeviceName(clientIp) + ' \u62d2\u7edd\u4e86\u4f60\u7684\u5165\u7fa4\u7533\u8bf7' }); return; }
      pending.resolved = true; joinRequests.delete(rIp);
      if (deviceSession.has(rIp)) { sendTo(rIp, { type: 'GROUP_JOIN_RESULT', success: false, message: '\u4f60\u5df2\u7ecf\u52a0\u5165\u5176\u4ed6\u4f1a\u8bdd' }); return; }
      s.members.add(rIp); deviceSession.set(rIp, gId);
      const p = sessionPayload(gId);
      notifySession(gId, { type: 'SESSION_JOINED', session: p });
      notifySession(gId, { type: 'MEMBER_JOINED', memberIp: rIp, memberName: getDeviceName(rIp), message: getDeviceName(rIp) + ' \u5df2\u52a0\u5165\u4f1a\u8bdd' });
      broadcastState(); break;
    }
    case 'DISCONNECT': leaveSession(clientIp, msg.message || (getDeviceName(clientIp) + ' \u5df2\u79bb\u5f00\u4f1a\u8bdd')); break;
    case 'OFFLINE':
      if (!isActiveSocket(clientIp, ws)) return;
      clearPendingFor(clientIp); leaveSession(clientIp, getDeviceName(clientIp) + ' \u5df2\u4e0b\u7ebf'); devices.delete(clientIp);
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
    default: break;
  }
}

// QR code
app.get('/qrcode', async function(req, res) {
  try {
    const url = 'http://' + ip.address() + ':' + PORT;
    const dataUrl = await qrcode.toDataURL(url, { width: 280, margin: 2 });
    res.json({ url: url, dataUrl: dataUrl });
  } catch(e) { res.status(500).json({ error: 'QR code error' }); }
});

// Resume upload
app.get('/upload-status', function(req, res) {
  const uploadId = String(req.query.uploadId || '').trim();
  if (!uploadId || uploadId.includes('..')) return res.json({ chunks: [] });
  const dir = path.join(CHUNK_DIR, uploadId);
  if (!fs.existsSync(dir)) return res.json({ chunks: [] });
  try {
    const chunks = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.part'); }).map(function(f) { return parseInt(f, 10); }).filter(function(n) { return !isNaN(n); });
    res.json({ chunks: chunks });
  } catch(e) { res.json({ chunks: [] }); }
});

// Upload
app.post('/upload', upload.any(), function(req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = String(req.body.uploaderIp || normalizeIp(req.ip)).trim();
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u8fde\u63a5' });
    for (const file of req.files || []) {
      session.files.push({ kind: 'file', name: file.originalname, path: '/files/' + file.filename, ip: uploaderIp, uploaderName: getDeviceName(uploaderIp), size: file.size, fileType: file.mimetype || '', time: new Date().toLocaleString('zh-CN'), uploadedAt: Date.now() });
    }
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u4e0a\u4f20\u5931\u8d25' }); }
});

// Chunk upload
app.post('/upload-chunk', chunkUpload.single('chunk'), function(req, res) {
  try {
    const uploadId = String(req.body.uploadId || '').trim();
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = String(req.body.uploaderIp || '').trim();
    const chunkIndex = Number(req.body.chunkIndex);
    const totalChunks = Number(req.body.totalChunks);
    if (!requireSession(sessionId, uploaderIp)) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u8fde\u63a5' });
    if (!req.file || !uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks <= 0) return res.status(400).json({ success: false, message: '\u5206\u7247\u53c2\u6570\u65e0\u6548' });
    if (!chunkUploads.has(uploadId)) {
      chunkUploads.set(uploadId, { sessionId: sessionId, uploaderIp: uploaderIp, fileName: String(req.body.fileName || 'file'), relativePath: String(req.body.relativePath || req.body.fileName || 'file'), fileSize: Number(req.body.fileSize || 0), fileType: String(req.body.fileType || ''), totalChunks: totalChunks });
      fs.mkdirSync(path.join(CHUNK_DIR, uploadId), { recursive: true });
    }
    fs.writeFileSync(path.join(CHUNK_DIR, uploadId, chunkIndex + '.part'), req.file.buffer);
    // Broadcast progress
    const meta = chunkUploads.get(uploadId);
    if (meta) {
      try {
        const done = fs.readdirSync(path.join(CHUNK_DIR, uploadId)).filter(function(f) { return f.endsWith('.part'); }).length;
        notifySession(sessionId, { type: 'UPLOAD_PROGRESS', uploadId: uploadId, uploaderIp: uploaderIp, uploaderName: getDeviceName(uploaderIp), fileName: meta.fileName, progress: Math.min(99, Math.round(done / meta.totalChunks * 100)) });
      } catch(e) {}
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u5206\u7247\u4e0a\u4f20\u5931\u8d25' }); }
});

// Begin folder batch
app.post('/begin-folder-batch', function(req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = String(req.body.uploaderIp || '').trim();
    const batchId = String(req.body.batchId || '').trim();
    const rootName = sanitizeName(req.body.rootName);
    const fileCount = Number(req.body.fileCount);
    if (!requireSession(sessionId, uploaderIp)) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u8fde\u63a5' });
    if (!batchId || !rootName || !Number.isInteger(fileCount) || fileCount <= 0) return res.status(400).json({ success: false, message: '\u6587\u4ef6\u5939\u6279\u6b21\u53c2\u6570\u65e0\u6548' });
    if (folderBatches.has(batchId)) return res.status(400).json({ success: false, message: '\u6587\u4ef6\u5939\u6279\u6b21\u5df2\u5b58\u5728' });
    folderBatches.set(batchId, { sessionId: sessionId, uploaderIp: uploaderIp, rootName: rootName, fileCount: fileCount, files: [] });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u521b\u5efa\u6587\u4ef6\u5939\u6279\u6b21\u5931\u8d25' }); }
});

// Upload complete (merge chunks)
app.post('/upload-complete', function(req, res) {
  try {
    const uploadId = String(req.body.uploadId || '').trim();
    const folderBatchId = String(req.body.folderBatchId || '').trim();
    const meta = chunkUploads.get(uploadId);
    if (!meta) return res.status(400).json({ success: false, message: '\u4e0a\u4f20\u4efb\u52a1\u4e0d\u5b58\u5728' });
    const session = requireSession(meta.sessionId, meta.uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u8fde\u63a5' });
    const mergedName = Date.now() + '_' + sanitizeName(meta.fileName);
    const mergedPath = path.join(UPLOAD_DIR, mergedName);
    fs.writeFileSync(mergedPath, Buffer.alloc(0));
    for (let i = 0; i < meta.totalChunks; i++) {
      const cp = path.join(CHUNK_DIR, uploadId, i + '.part');
      if (!fs.existsSync(cp)) return res.status(400).json({ success: false, message: '\u5206\u7247\u7f3a\u5931\uff0c\u65e0\u6cd5\u5408\u5e76' });
      fs.appendFileSync(mergedPath, fs.readFileSync(cp));
    }
    fs.rmSync(path.join(CHUNK_DIR, uploadId), { recursive: true, force: true });
    chunkUploads.delete(uploadId);
    notifySession(meta.sessionId, { type: 'UPLOAD_PROGRESS', uploadId: uploadId, uploaderIp: meta.uploaderIp, uploaderName: getDeviceName(meta.uploaderIp), fileName: meta.fileName, progress: 100, done: true });
    if (folderBatchId) {
      const batch = folderBatches.get(folderBatchId);
      if (!batch || batch.sessionId !== meta.sessionId || batch.uploaderIp !== meta.uploaderIp) return res.status(400).json({ success: false, message: '\u6587\u4ef6\u5939\u6279\u6b21\u65e0\u6548\u6216\u5df2\u8fc7\u671f' });
      let relPath = String(meta.relativePath || meta.fileName).replace(/\\/g, '/');
      const rp = batch.rootName + '/';
      if (relPath.startsWith(rp)) relPath = relPath.slice(rp.length);
      if (!relPath || relPath === batch.rootName) relPath = path.basename(meta.fileName) || 'file';
      batch.files.push({ relPath: relPath, path: '/files/' + mergedName, size: meta.fileSize || 0, fileType: meta.fileType || '' });
      if (batch.files.length === batch.fileCount) {
        session.files.push({ kind: 'folder', id: folderBatchId, name: batch.rootName, ip: batch.uploaderIp, uploaderName: getDeviceName(batch.uploaderIp), time: new Date().toLocaleString('zh-CN'), uploadedAt: Date.now(), items: batch.files.slice() });
        folderBatches.delete(folderBatchId);
        notifySession(meta.sessionId, { type: 'FILE_LIST', list: session.files });
      }
      broadcastState(); return res.json({ success: true });
    }
    session.files.push({ kind: 'file', name: meta.relativePath || meta.fileName, path: '/files/' + mergedName, ip: meta.uploaderIp, uploaderName: getDeviceName(meta.uploaderIp), size: meta.fileSize || 0, fileType: meta.fileType || '', time: new Date().toLocaleString('zh-CN'), uploadedAt: Date.now() });
    notifySession(meta.sessionId, { type: 'FILE_LIST', list: session.files });
    broadcastState(); res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u6587\u4ef6\u5408\u5e76\u5931\u8d25' }); }
});

// Delete file
app.post('/delete-file', function(req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = String(req.body.uploaderIp || '').trim();
    const filePath = String(req.body.filePath || '').trim();
    const fileId = String(req.body.fileId || '').trim();
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548' });
    const idx = session.files.findIndex(function(f) { return (fileId && f.id === fileId) || (filePath && f.path === filePath); });
    if (idx === -1) return res.status(404).json({ success: false, message: '\u6587\u4ef6\u4e0d\u5b58\u5728' });
    const file = session.files[idx];
    if (file.ip !== uploaderIp) return res.status(403).json({ success: false, message: '\u53ea\u80fd\u5220\u9664\u81ea\u5df1\u4e0a\u4f20\u7684\u6587\u4ef6' });
    session.files.splice(idx, 1);
    if (file.kind === 'file' && file.path) { const dp = resolveUploadPath(file.path); if (dp) try { fs.unlinkSync(dp); } catch(e) {} }
    else if (file.kind === 'folder' && file.items) { file.items.forEach(function(item) { const dp = resolveUploadPath(item.path); if (dp) try { fs.unlinkSync(dp); } catch(e) {} }); }
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u5220\u9664\u5931\u8d25' }); }
});

// Rename file
app.post('/rename-file', function(req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const uploaderIp = String(req.body.uploaderIp || '').trim();
    const filePath = String(req.body.filePath || '').trim();
    const fileId = String(req.body.fileId || '').trim();
    const newName = sanitizeName(String(req.body.newName || '').trim());
    if (!newName) return res.status(400).json({ success: false, message: '\u6587\u4ef6\u540d\u4e0d\u80fd\u4e3a\u7a7a' });
    const session = requireSession(sessionId, uploaderIp);
    if (!session) return res.status(400).json({ success: false, message: '\u4f1a\u8bdd\u5df2\u5931\u6548' });
    const file = session.files.find(function(f) { return (fileId && f.id === fileId) || (filePath && f.path === filePath); });
    if (!file) return res.status(404).json({ success: false, message: '\u6587\u4ef6\u4e0d\u5b58\u5728' });
    if (file.ip !== uploaderIp) return res.status(403).json({ success: false, message: '\u53ea\u80fd\u91cd\u547d\u540d\u81ea\u5df1\u4e0a\u4f20\u7684\u6587\u4ef6' });
    file.name = newName;
    notifySession(sessionId, { type: 'FILE_LIST', list: session.files });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: '\u91cd\u547d\u540d\u5931\u8d25' }); }
});

// Batch ZIP download
app.post('/batch-download-zip', function(req, res) {
  try {
    const sessionId = String(req.body.sessionId || '').trim();
    const rIp = String(req.body.requesterIp || normalizeIp(req.ip)).trim();
    const fileKeys = Array.isArray(req.body.fileKeys) ? req.body.fileKeys.map(String) : [];
    const session = requireSession(sessionId, rIp);
    if (!session) return res.status(403).send('\u65e0\u6743\u4e0b\u8f7d');
    if (!fileKeys.length) return res.status(400).send('\u672a\u9009\u62e9\u6587\u4ef6');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sendfile_batch_' + Date.now() + '.zip"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', function() { if (!res.headersSent) res.status(500).end(); });
    archive.pipe(res);
    for (const file of session.files) {
      const key = file.path || file.id; if (!fileKeys.includes(key)) continue;
      if (file.kind === 'file' && file.path) { const dp = resolveUploadPath(file.path); if (dp && fs.existsSync(dp)) archive.file(dp, { name: file.name || path.basename(dp) }); }
      else if (file.kind === 'folder' && file.items) { file.items.forEach(function(item) { const dp = resolveUploadPath(item.path); if (dp && fs.existsSync(dp)) archive.file(dp, { name: file.name + '/' + item.relPath }); }); }
    }
    archive.finalize();
  } catch(e) { if (!res.headersSent) res.status(500).send('\u6253\u5305\u5931\u8d25'); }
});

// Folder ZIP download
app.get('/download-folder-zip', function(req, res) {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    const folderId = String(req.query.folderId || '').trim();
    const rIp = String(req.query.requesterIp || normalizeIp(req.ip)).trim();
    const session = requireSession(sessionId, rIp);
    if (!session) return res.status(403).send('\u65e0\u6743\u4e0b\u8f7d');
    const entry = session.files.find(function(f) { return f.kind === 'folder' && f.id === folderId; });
    if (!entry || !entry.items || !entry.items.length) return res.status(404).send('\u6587\u4ef6\u5939\u4e0d\u5b58\u5728');
    const zipName = sanitizeName(entry.name) + '.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(zipName) + '"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', function() { if (!res.headersSent) res.status(500).end(); });
    archive.pipe(res);
    for (const item of entry.items) {
      const n = String(item.path || '').replace(/^\/files\//, ''); if (!n) continue;
      const dp = path.join(UPLOAD_DIR, n);
      if (dp.startsWith(UPLOAD_DIR) && fs.existsSync(dp)) archive.file(dp, { name: String(item.relPath || path.basename(n)).replace(/\\/g, '/') });
    }
    archive.finalize();
  } catch(e) { if (!res.headersSent) res.status(500).send('\u6253\u5305\u5931\u8d25'); }
});

// Word preview
app.get('/preview/docx', async function(req, res) {
  try {
    const dp = resolveUploadPath(req.query.path);
    if (!dp || !fs.existsSync(dp)) return res.status(404).send('\u6587\u4ef6\u4e0d\u5b58\u5728');
    const result = await mammoth.convertToHtml({ path: dp });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{margin:0;padding:24px;color:#172033;font:15px/1.7 "Microsoft YaHei",Arial,sans-serif;background:#fff}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d9e1ec;padding:6px 8px}</style></head><body>' + (result.value || '<p>\u6587\u6863\u6ca1\u6709\u53ef\u9884\u89c8\u5185\u5bb9</p>') + '</body></html>');
  } catch(e) { res.status(500).send('Word \u6587\u6863\u9884\u89c8\u5931\u8d25'); }
});

// Error handler
app.use(function(err, req, res, next) {
  if (!(err instanceof multer.MulterError)) return next(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: '\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 ' + Math.floor(MAX_FILE_SIZE / 1024 / 1024) + 'MB' });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(413).json({ success: false, message: '\u5355\u6b21\u4e0a\u4f20\u6587\u4ef6\u6570\u91cf\u4e0d\u80fd\u8d85\u8fc7 ' + MAX_FILES_PER_UPLOAD + ' \u4e2a' });
  return res.status(413).json({ success: false, message: '\u4e0a\u4f20\u6587\u4ef6\u4e0d\u7b26\u5408\u9650\u5236\u6761\u4ef6' });
});

// Auto cleanup (every hour, delete files older than 24h not in any session)
setInterval(function() {
  try {
    const now = Date.now();
    const inUse = new Set();
    for (const s of sessions.values()) {
      for (const f of s.files) {
        if (f.path) inUse.add(f.path.replace('/files/', ''));
        if (f.items) f.items.forEach(function(item) { if (item.path) inUse.add(item.path.replace('/files/', '')); });
      }
    }
    const files = fs.readdirSync(UPLOAD_DIR).filter(function(f) { return !f.startsWith('.'); });
    for (const f of files) {
      if (inUse.has(f)) continue;
      const fp = path.join(UPLOAD_DIR, f);
      try { if (now - fs.statSync(fp).mtimeMs > FILE_EXPIRE_MS) fs.unlinkSync(fp); } catch(e) {}
    }
  } catch(e) {}
}, 60 * 60 * 1000);

module.exports = { app: app, server: server };
