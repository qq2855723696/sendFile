export function formatSize(size) {
  const value = Number(size || 0)
  if (value >= 1073741824) return `${(value / 1073741824).toFixed(2)} GB`
  if (value >= 1048576) return `${(value / 1048576).toFixed(2)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`
  return `${value} B`
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function fileSizeText(row) {
  const size = Number(row?.size || 0)
  return size > 0 ? formatSize(size) : '—'
}

export function fileExtension(row) {
  const name = String(row?.name || row?.relPath || '').split('?')[0]
  const base = name.split('/').pop() || ''
  const index = base.lastIndexOf('.')
  return index >= 0 ? base.slice(index + 1).toLowerCase() : ''
}

export function fileKindText(row) {
  const type = String(row?.fileType || '').toLowerCase()
  const ext = fileExtension(row)
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return '🖼 图片'
  if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return '🎬 视频'
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return '🎵 音频'
  if (type === 'application/pdf' || ext === 'pdf') return '📄 PDF'
  if (ext === 'docx' || ext === 'doc') return '📝 Word'
  if (type.startsWith('text/') || ['txt', 'md', 'json', 'js', 'ts', 'css', 'html', 'xml', 'csv'].includes(ext)) return '📃 文本'
  return ext ? ext.toUpperCase() : '文件'
}

export function previewMode(row) {
  const type = String(row?.fileType || '').toLowerCase()
  const ext = fileExtension(row)
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image'
  if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio'
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (type.startsWith('text/') || ['txt', 'md', 'json', 'js', 'ts', 'css', 'html', 'xml', 'csv', 'log', 'yaml', 'yml', 'sh', 'py', 'java', 'go', 'rs'].includes(ext)) return 'text'
  return 'unsupported'
}

export function isImageFile(row) {
  const type = String(row?.fileType || '').toLowerCase()
  const ext = fileExtension(row)
  return row?.kind === 'file' && (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext))
}

export function fileIcon(row) {
  const ext = fileExtension(row)
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '🎬'
  if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(ext)) return '🎵'
  if (ext === 'pdf') return '📄'
  if (['docx', 'doc'].includes(ext)) return '📝'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗂️'
  if (['js', 'ts', 'py', 'go', 'java', 'sh', 'css', 'html', 'json', 'yml', 'yaml'].includes(ext)) return '💻'
  return '📄'
}

export function statusText(status) {
  return ({ online: '在线', busy: '忙碌', away: '离开' })[status] || '在线'
}

export function statusType(status) {
  return ({ online: 'success', busy: 'warning', away: 'info' })[status] || 'success'
}

