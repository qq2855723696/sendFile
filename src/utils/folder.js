export function buildFolderBrowseRows(items, subPath) {
  const prefix = String(subPath || '').replace(/\\/g, '/').replace(/\/+$/, '')
  const dirs = new Set()
  const files = []

  for (const item of items || []) {
    const rel = String(item.relPath || '').replace(/\\/g, '/')
    const rest = prefix ? rel.replace(`${prefix}/`, '') : rel
    if (prefix && !rel.startsWith(`${prefix}/`)) continue
    if (rest.includes('/')) {
      dirs.add(rest.split('/')[0])
    } else {
      files.push({
        type: 'file',
        name: rest,
        path: item.path,
        size: item.size || 0,
        fileType: item.fileType || ''
      })
    }
  }

  return [
    ...Array.from(dirs).sort().map(name => ({ type: 'folder', name })),
    ...files.sort((a, b) => a.name.localeCompare(b.name))
  ]
}

