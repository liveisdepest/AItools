<template>
  <div class="ai-page">
    <AiNav />

    <main v-if="loading" class="ai-shell" style="padding-top: 40px">
      <div class="ai-skeleton" style="height: 56px; margin-bottom: 14px"></div>
      <div class="ai-skeleton" style="height: 320px"></div>
    </main>

    <div v-else-if="loadError" class="ai-shell" style="padding-top: 40px">
      <div class="ai-empty">
        <span class="emoji">🫥</span>
        <h3>打不开这个智能体</h3>
        <p>{{ loadError }}</p>
        <router-link to="/ai/agents" class="ai-btn ai-btn--ghost" style="margin-top: 14px">返回智能体列表</router-link>
      </div>
    </div>

    <div v-else-if="agent" class="ai-chat-shell">
      <header class="ai-chat-head">
        <router-link to="/ai/agents" class="ai-chat-back">← 智能体</router-link>

        <div class="ai-chat-identity">
          <span class="ai-chat-icon">{{ agent.icon }}</span>
          <div>
            <h1>{{ agent.name }}</h1>
            <p>{{ agent.tagline }}</p>
          </div>
        </div>

        <span class="ai-chat-model" :class="{ 'is-mock': llm && !llm.configured }">
          {{ llm && !llm.configured ? '示例模式' : (llm?.model || '') }}
        </span>
      </header>

      <div ref="scrollRef" class="ai-chat">
        <div v-if="!messages.length" class="ai-chat-empty">
          <div class="ai-chat-empty-icon">{{ agent.icon }}</div>
          <h2>{{ agent.name }}</h2>
          <p class="ai-chat-empty-desc">{{ agent.description }}</p>

          <div v-if="agent.starterPrompts.length" class="ai-starters">
            <button
              v-for="prompt in agent.starterPrompts"
              :key="prompt"
              type="button"
              class="ai-starter"
              @click="useStarter(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <ChatMessage
          v-for="(message, index) in messages"
          :key="index"
          :role="message.role"
          :name="agent.name"
          :content="message.content"
          :attachments="message.attachments"
          :error="message.error"
          :mock="message.mock"
        />

        <div v-if="sending" class="ai-msg assistant">
          <div class="ai-msg-role">{{ agent.name }}</div>
          <div class="ai-typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="ai-composer">
        <div v-if="chatError" class="ai-chat-error">{{ chatError }}</div>

        <div v-if="attachments.length" class="ai-attach-row">
          <span v-for="file in attachments" :key="file.id" class="ai-attach-chip">
            {{ file.kind === 'image' ? '🖼️' : '📄' }} {{ file.name }}
            <button type="button" aria-label="移除" @click="removeAttachment(file.id)">×</button>
          </span>
        </div>

        <div class="ai-composer-box">
          <textarea
            ref="textareaRef"
            v-model="input"
            rows="1"
            placeholder="描述你要完成的任务，Enter 发送，Shift + Enter 换行"
            @keydown.enter.exact.prevent="send"
          ></textarea>

          <div class="ai-composer-actions">
            <button
              type="button"
              class="ai-icon-btn"
              :disabled="uploading || !agent.capabilities.length"
              title="上传文件"
              @click="pickFile"
            >
              {{ uploading ? '⏳' : '📎' }}
            </button>
            <input ref="fileInput" type="file" multiple hidden @change="onFileChange" />

            <button
              type="button"
              class="ai-btn ai-btn--primary ai-btn--sm"
              :disabled="sending || uploading || (!input.trim() && !attachments.length)"
              @click="send"
            >
              {{ sending ? '思考中…' : '发送' }}
            </button>
          </div>
        </div>

        <p class="ai-composer-tip">
          <template v-if="agent.capabilities.length">支持 txt / md / json / csv 与图片，单文件 ≤ 10MB · </template>
          智能体输出仅供参考，请核对关键信息
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AiNav from '../../components/ai/AiNav.vue'
import ChatMessage from '../../components/ai/ChatMessage.vue'
import { getAgentApi, getSessionId, runAgentApi, uploadAgentFileApi } from '../../api/agents.js'
import '../../assets/ai.css'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const agent = ref(null)
const llm = ref(null)
const loading = ref(true)
const loadError = ref('')

const messages = ref([])
const input = ref('')
const attachments = ref([])
const uploading = ref(false)
const sending = ref(false)
const chatError = ref('')

const scrollRef = ref(null)
const fileInput = ref(null)
const textareaRef = ref(null)

function scrollToBottom () {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function load () {
  loading.value = true
  loadError.value = ''
  messages.value = []
  input.value = ''
  attachments.value = []

  try {
    const res = await getAgentApi(slug.value)
    if (res.code !== 200) throw new Error(res.message || '接口异常')
    agent.value = res.data.agent
    llm.value = res.data.llm
    document.title = `${agent.value.name} · AI Toolbox`
  } catch (err) {
    loadError.value = err.response?.data?.message || '智能体不存在，或后端没启动'
  } finally {
    loading.value = false
  }
}

function pickFile () {
  fileInput.value?.click()
}

async function onFileChange (event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  chatError.value = ''

  for (const file of files) {
    try {
      const res = await uploadAgentFileApi(file)
      if (res.code !== 200) throw new Error(res.message)
      attachments.value.push(res.data)
    } catch (err) {
      chatError.value = err.response?.data?.message || `「${file.name}」上传失败`
    }
  }

  uploading.value = false
}

function removeAttachment (id) {
  attachments.value = attachments.value.filter((file) => file.id !== id)
}

function useStarter (prompt) {
  input.value = prompt
  textareaRef.value?.focus()
}

async function send () {
  const text = input.value.trim()
  if (sending.value || uploading.value) return
  if (!text && attachments.value.length === 0) return

  const files = attachments.value.slice()
  const history = messages.value.map((m) => ({ role: m.role, content: m.content }))

  messages.value.push({
    role: 'user',
    content: text || '（上传了文件，请分析）',
    attachments: files.map((f) => ({ id: f.id, name: f.name, kind: f.kind })),
  })

  input.value = ''
  attachments.value = []
  sending.value = true
  chatError.value = ''
  scrollToBottom()

  try {
    const res = await runAgentApi(slug.value, {
      message: text,
      history: history.slice(-10),
      fileIds: files.map((f) => f.id),
      sessionId: getSessionId(),
    })

    if (res.code !== 200) throw new Error(res.message)

    messages.value.push({
      role: 'assistant',
      content: res.data.reply,
      mock: res.data.mock,
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: err.response?.data?.message || err.message || '请求失败，请稍后重试',
      error: true,
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

watch(slug, load)

onMounted(load)
</script>
