/**
 * 极简富文本解析：只处理 **加粗**、> 引用、- / 1. 列表。
 * 不用 v-html，避免模型输出被当成 HTML 执行。
 */

function inlineSegments (text) {
  const segments = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let match

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ bold: false, text: text.slice(last, match.index) })
    segments.push({ bold: true, text: match[1] })
    last = match.index + match[0].length
  }

  if (last < text.length) segments.push({ bold: false, text: text.slice(last) })
  return segments.length ? segments : [{ bold: false, text }]
}

export function parseRich (text = '') {
  const blocks = []

  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trimEnd()

    if (!line.trim()) {
      blocks.push({ type: 'gap' })
      continue
    }

    if (/^>\s?/.test(line)) {
      blocks.push({ type: 'quote', segments: inlineSegments(line.replace(/^>\s?/, '')) })
      continue
    }

    const listMatch = line.match(/^(\d+\.|[-*])\s+(.*)$/)
    if (listMatch) {
      blocks.push({
        type: 'li',
        ordered: /^\d+\./.test(listMatch[1]),
        segments: inlineSegments(listMatch[2]),
      })
      continue
    }

    blocks.push({ type: 'p', segments: inlineSegments(line) })
  }

  return blocks
}
