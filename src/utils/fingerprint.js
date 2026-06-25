export function fileFingerprint(file) {
  let hash = 0
  // 用 webkitRelativePath 区分文件夹内不同子目录的同名文件，避免 uploadId 冲突
  const key = `${file.webkitRelativePath || file.name}_${file.size}_${file.lastModified}`
  for (let i = 0; i < key.length; i += 1) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
  }
  return `sf_${Math.abs(hash).toString(36)}_${file.size.toString(36)}`
}

