/** 工具站通用展示逻辑 */

export const PRICING_LABELS = {
  free: '免费',
  freemium: '免费+付费',
  paid: '付费',
  trial: '试用',
}

export const PLATFORM_LABELS = {
  web: '网页',
  ios: 'iOS',
  android: 'Android',
  desktop: '桌面端',
  api: 'API',
  chrome: '浏览器插件',
}

export const SORT_OPTIONS = [
  { value: 'recommend', label: '推荐优先' },
  { value: 'newest', label: '最新收录' },
  { value: 'rating', label: '评分最高' },
  { value: 'clicks', label: '最多访问' },
]

export function pricingLabel (type) {
  return PRICING_LABELS[type] || '未知'
}

export function pricingClass (type) {
  return `ai-badge ai-badge--${PRICING_LABELS[type] ? type : 'freemium'}`
}

export function platformLabel (key) {
  return PLATFORM_LABELS[key] || key
}

export function initialOf (name = '') {
  return (name.trim().charAt(0) || '?').toUpperCase()
}

/**
 * logo 优先用后端给的 logoUrl，没有就用域名 favicon 兜底。
 * 返回空字符串表示两者都没有，交给字母头像。
 */
export function logoOf (tool) {
  if (tool?.logoUrl) return tool.logoUrl
  const url = tool?.websiteUrl
  if (!url) return ''
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`
  } catch {
    return ''
  }
}

/** 详情页正文：后端存的是 Markdown，这里先按纯文本分段渲染，避免引额外依赖 */
export function paragraphsOf (text) {
  if (!text) return []
  return String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}
