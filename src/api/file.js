import request, { rawRequest } from './index'

export function beginFolderBatch(payload) {
  return request.post('/begin-folder-batch', payload)
}

export function getUploadStatus(uploadId) {
  return request.get('/upload-status', {
    params: { uploadId },
    silent: true
  })
}

export function uploadChunk(formData) {
  return request.post('/upload-chunk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0
  })
}

export function completeUpload(payload) {
  return request.post('/upload-complete', payload)
}

export function deleteFileEntry(payload) {
  return request.post('/delete-file', payload)
}

export function renameFileEntry(payload) {
  return request.post('/rename-file', payload)
}

export function downloadBatchZip(payload) {
  return rawRequest.post('/batch-download-zip', payload)
}

export function getTextFile(url) {
  return request.get(url, {
    transformResponse: value => value,
    responseType: 'text',
    silent: true
  })
}

export function getFolderZipUrl(sessionId, folderId, requesterIp) {
  return `/download-folder-zip?sessionId=${encodeURIComponent(sessionId)}&folderId=${encodeURIComponent(folderId)}&requesterIp=${encodeURIComponent(requesterIp)}`
}

export function getDocxPreviewUrl(path) {
  return `/preview/docx?path=${encodeURIComponent(path)}`
}

