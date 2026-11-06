<template>
  <div class="ai-page">
    <AiNav />

    <main class="ai-shell">
      <section class="ai-page-head">
        <h1 class="ai-page-title">创建智能体</h1>
        <p class="ai-page-sub">写清它是谁、能干什么，保存后立刻可以试跑。</p>
      </section>

      <div class="ai-builder-layout">
        <form class="ai-builder-form" @submit.prevent="save">
          <!-- 基本信息 -->
          <section class="ai-form-section">
            <h2>① 基本信息</h2>

            <label class="ai-field">
              <span>图标</span>
              <div class="ai-icon-picker">
                <button
                  v-for="emoji in EMOJIS"
                  :key="emoji"
                  type="button"
                  :class="{ 'is-active': form.icon === emoji }"
                  @click="form.icon = emoji"
                >
                  {{ emoji }}
                </button>
              </div>
            </label>

            <div class="ai-field-row">
              <label class="ai-field">
                <span>名称 *</span>
                <input
                  v-model="form.name"
                  type="text"
                  maxlength="24"
                  placeholder="例如：合同审阅助手"
                  @input="syncSlug"
                />
              </label>

              <label class="ai-field">
                <span>标识（URL 里的名字）</span>
                <input
                  v-model="form.slug"
                  type="text"
                  maxlength="64"
                  placeholder="contract-review"
                  @input="slugTouched = true"
                />
              </label>
            </div>

            <label class="ai-field">
              <span>一句话说明 *</span>
              <input
                v-model="form.tagline"
                type="text"
                maxlength="60"
                placeholder="从合同里挑出对你不利的条款"
              />
            </label>

            <label class="ai-field">
              <span>详细描述（会显示在对话页空状态里）</span>
              <textarea v-model="form.description" rows="3" placeholder="它能做什么、适合什么场景、有什么限制。"></textarea>
            </label>
          </section>

          <!-- 角色设定 -->
          <section class="ai-form-section">
            <h2>② 角色设定 *</h2>
            <p class="ai-form-hint">
              这段话会作为 system 消息发给模型，决定它的身份、边界和输出格式。写得越具体，输出越稳定。
            </p>

            <textarea
              v-model="form.systemPrompt"
              class="ai-prompt"
              rows="12"
              placeholder="你是一位……&#10;&#10;用户会……，你的任务是……&#10;&#10;工作要求：&#10;1. ……&#10;2. ……&#10;3. 不确定的信息要明确说明，不要编造"
            ></textarea>

            <div class="ai-prompt-foot">
              <button type="button" class="ai-add-btn" @click="applyTemplate">插入模板</button>
              <span>{{ form.systemPrompt.length }} 字</span>
            </div>
          </section>

          <!-- 能力 -->
          <section class="ai-form-section">
            <h2>③ 能力</h2>
            <div class="ai-cap-options">
              <label class="ai-cap-option" :class="{ 'is-on': form.capabilities.includes('file') }">
                <input
                  type="checkbox"
                  :checked="form.capabilities.includes('file')"
                  @change="toggleCap('file')"
                />
                <span>
                  <strong>📄 读取文件</strong>
                  <em>支持 txt / md / json / csv / log，文件正文会拼进对话上下文</em>
                </span>
              </label>

              <label class="ai-cap-option" :class="{ 'is-on': form.capabilities.includes('image') }">
                <input
                  type="checkbox"
                  :checked="form.capabilities.includes('image')"
                  @change="toggleCap('image')"
                />
                <span>
                  <strong>🖼️ 分析图片</strong>
                  <em>需要后端配置多模态模型（LLM_VISION_MODEL），否则会报错</em>
                </span>
              </label>
            </div>
          </section>

          <!-- 推荐提问 -->
          <section class="ai-form-section">
            <h2>④ 推荐提问</h2>
            <p class="ai-form-hint">对话页空状态会展示这几条，点一下就发出去。最多 6 条。</p>

            <div v-for="(_, index) in form.starterPrompts" :key="index" class="ai-starter-row">
              <input
                v-model="form.starterPrompts[index]"
                type="text"
                maxlength="60"
                :placeholder="`例如：${STARTER_HINTS[index % STARTER_HINTS.length]}`"
              />
              <button type="button" aria-label="删除" @click="removeStarter(index)">×</button>
            </div>

            <button
              v-if="form.starterPrompts.length < 6"
              type="button"
              class="ai-add-btn"
              @click="form.starterPrompts.push('')"
            >
              + 添加一条
            </button>
          </section>

          <!-- 高级 -->
          <section class="ai-form-section">
            <h2>⑤ 高级</h2>

            <label class="ai-field">
              <span>温度：越低越稳定，越高越发散</span>
              <div class="ai-range-row">
                <input v-model.number="form.temperature" type="range" min="0" max="1" step="0.05" />
                <span class="ai-range-val">{{ Number(form.temperature).toFixed(2) }}</span>
              </div>
            </label>

            <label class="ai-switch">
              <input v-model="form.isPublished" type="checkbox" />
              保存后立即发布（取消勾选则先建为草稿，不显示在列表里）
            </label>
          </section>

          <p v-if="error" class="ai-form-error">{{ error }}</p>

          <div class="ai-builder-submit">
            <router-link to="/ai/agents" class="ai-btn ai-btn--ghost">取消</router-link>
            <button type="submit" class="ai-btn ai-btn--primary" :disabled="saving">
              {{ saving ? '保存中…' : '保存并试跑' }}
            </button>
          </div>
        </form>

        <aside class="ai-builder-preview">
          <div class="ai-preview-label">列表里的样子</div>

          <div class="ai-agent-card is-preview">
            <div class="ai-agent-icon">{{ form.icon || '🤖' }}</div>
            <h3>{{ form.name || '未命名智能体' }}</h3>
            <p class="ai-agent-tagline">{{ form.tagline || '一句话说明会显示在这里' }}</p>

            <div v-if="form.capabilities.length" class="ai-agent-caps">
              <span v-if="form.capabilities.includes('file')" class="ai-cap">📄 读文件</span>
              <span v-if="form.capabilities.includes('image')" class="ai-cap">🖼️ 看图片</span>
            </div>

            <div class="ai-agent-foot">
              <span>已运行 0 次</span>
              <span class="ai-card-go">开始 →</span>
            </div>
          </div>

          <p class="ai-preview-note">
            保存后会跳到对话页，可以直接试跑。想改的时候目前要改数据库——编辑页是下一步。
          </p>
        </aside>
      </div>
    </main>

    <footer class="ai-footer">
      AI Toolbox · 智能体输出仅供参考，请自行核对关键信息
    </footer>
  </div>
</template>

<script setup>
import { inject, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AiNav from '../../components/ai/AiNav.vue'
import { createAgentApi } from '../../api/agents.js'
import '../../assets/ai.css'

const EMOJIS = [
  '🤖', '📄', '🖼️', '🧭', '📝', '🔍', '🧮', '📊',
  '⚖️', '💡', '🎯', '🧠', '🗂️', '✉️', '🧾', '🔧',
  '🎨', '🎬', '🎧', '📚', '🧪', '🚀', '🌐', '💬',
]

const STARTER_HINTS = [
  '帮我看看这份文件',
  '这个该怎么拆解？',
  '总结一下要点',
  '有什么风险？',
]

const TEMPLATE = `你是一位（角色）助手。

用户会给你（输入），你的任务是（目标）。

工作要求：
1. （第一条硬性要求）
2. （第二条硬性要求）
3. 输出用中文，结构清晰，能用列表就别写成大段文字
4. 不确定的信息必须明确说明，不要编造数字、日期和人名`

const router = useRouter()
const showToast = inject('showToast', () => {})

const saving = ref(false)
const error = ref('')
const slugTouched = ref(false)

const form = reactive({
  icon: '🤖',
  name: '',
  slug: '',
  tagline: '',
  description: '',
  systemPrompt: '',
  capabilities: [],
  starterPrompts: [''],
  temperature: 0.6,
  isPublished: true,
})

function slugify (text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function syncSlug () {
  if (!slugTouched.value) form.slug = slugify(form.name)
}

function toggleCap (cap) {
  const index = form.capabilities.indexOf(cap)
  if (index >= 0) form.capabilities.splice(index, 1)
  else form.capabilities.push(cap)
}

function removeStarter (index) {
  form.starterPrompts.splice(index, 1)
  if (form.starterPrompts.length === 0) form.starterPrompts.push('')
}

function applyTemplate () {
  form.systemPrompt = form.systemPrompt.trim()
    ? `${form.systemPrompt.trim()}\n\n${TEMPLATE}`
    : TEMPLATE
}

function validate () {
  if (!form.name.trim()) return '请填写名称'
  if (!form.tagline.trim()) return '请填写一句话说明'
  if (form.systemPrompt.trim().length < 20) return '角色设定至少写 20 个字，太短模型抓不住重点'
  if (form.slug && !/^[a-z0-9][a-z0-9-]{2,63}$/.test(form.slug)) {
    return '标识只能用小写字母、数字和短横线，3-64 位'
  }
  return ''
}

async function save () {
  error.value = validate()
  if (error.value) return

  saving.value = true
  try {
    const res = await createAgentApi({
      icon: form.icon,
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      systemPrompt: form.systemPrompt,
      capabilities: form.capabilities,
      starterPrompts: form.starterPrompts.map((s) => s.trim()).filter(Boolean),
      temperature: Number(form.temperature),
      isPublished: form.isPublished,
    })

    if (res.code !== 200) throw new Error(res.message || '创建失败')

    showToast('智能体已创建')
    router.push(`/ai/agents/${res.data.agent.slug}`)
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '创建失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  document.title = '创建智能体 · AI Toolbox'
})
</script>
