/**
 * 大模型调用层
 *
 * 走 OpenAI 兼容的 /chat/completions 协议，所以 DeepSeek、Moonshot、通义、OpenAI、
 * 本地 Ollama 都能用，换服务商只改 .env，不改代码。
 *
 * 没配 LLM_API_KEY 时进入 mock 模式：返回结构化的示例回复，
 * 让前端能完整跑通交互，不会因为没 Key 就白屏。
 */

function readConfig () {
  return {
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
    visionModel: process.env.LLM_VISION_MODEL || '',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 60000),
  }
}

function isConfigured () {
  return Boolean(readConfig().apiKey)
}

function publicStatus () {
  const cfg = readConfig()
  return {
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    visionModel: cfg.visionModel || null,
  }
}

/** 从消息里抽出纯文本，mock 模式用它生成像样的回复 */
function flatten (content) {
  if (typeof content === 'string') return { text: content, images: 0 }
  if (!Array.isArray(content)) return { text: '', images: 0 }

  let text = ''
  let images = 0
  for (const part of content) {
    if (part.type === 'text') text += part.text
    if (part.type === 'image_url') images += 1
  }
  return { text, images }
}

function mockReply (messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const { text, images } = flatten(lastUser?.content)

  const files = [...text.matchAll(/--- 文件：(.+?) ---\n([\s\S]*?)(?=\n--- 文件：|$)/g)].map((m) => ({
    name: m[1],
    body: m[2].trim(),
  }))

  const question = text.split('\n--- 文件：')[0].trim()
  const lines = ['> 当前是**示例模式**（未配置 `LLM_API_KEY`），下面是模拟回复，用来验证交互是否跑通。', '']

  if (images > 0) {
    lines.push(`我收到了 **${images} 张图片**。真实模式下，这里会输出：画面主体、场景环境、可识别的文字信息，以及无法确认的部分。`)
    lines.push('')
  }

  if (files.length > 0) {
    lines.push(`我读到了 **${files.length} 个文件**：`)
    for (const file of files) {
      const preview = file.body.slice(0, 80).replace(/\s+/g, ' ')
      lines.push(`- **${file.name}**，约 ${file.body.length} 字，开头是：「${preview}…」`)
    }
    lines.push('')
    lines.push('**要点摘要**')
    lines.push('1. （示例）第一条要点会在这里')
    lines.push('2. （示例）第二条要点会在这里')
    lines.push('3. （示例）第三条要点会在这里')
  } else if (images === 0) {
    lines.push('（示例）收到你的问题，真实模式下这里会是模型给出的回答。')
  }

  if (question) {
    lines.push('')
    lines.push(`**针对「${question.slice(0, 40)}」的回答**`)
    lines.push('（示例）配置好 API Key 后，这里会给出基于文件内容的具体答案；文件里没有的信息会明确说明「文件中没有提到」。')
  }

  return lines.join('\n')
}

/**
 * @param {object} options
 * @param {Array} options.messages  OpenAI 格式消息数组
 * @param {string} [options.model]
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens]
 */
async function chat ({ messages, model, temperature = 0.7, maxTokens = 2000 }) {
  const cfg = readConfig()

  if (!cfg.apiKey) {
    return {
      content: mockReply(messages),
      model: 'mock',
      mock: true,
      usage: { prompt_tokens: 0, completion_tokens: 0 },
    }
  }

  const useModel = model || cfg.model
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs)

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: useModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      const error = new Error(`模型服务返回 ${response.status}：${body.slice(0, 300)}`)
      error.status = 502
      throw error
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content,
      model: data.model || useModel,
      mock: false,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
      },
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeout = new Error(`模型响应超时（${cfg.timeoutMs}ms）`)
      timeout.status = 504
      throw timeout
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { chat, isConfigured, publicStatus, readConfig }
