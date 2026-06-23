export function fileFingerprint(file) {
  let hash = 0
  const key = `${file.name}_${file.size}_${file.lastModified}`
  for (let i = 0; i < key.length; i += 1) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
  }
  return `sf_${Math.abs(hash).toString(36)}_${file.size.toString(36)}`
}

