<template>
  <div class="ai-msg" :class="role">
    <div class="ai-msg-role">{{ role === 'user' ? '你' : name }}</div>

    <div class="ai-msg-body" :class="{ 'is-error': error, 'is-mock': mock }">
      <template v-for="(block, index) in blocks" :key="index">
        <p v-if="block.type === 'p'">
          <span
            v-for="(seg, i) in block.segments"
            :key="i"
            :class="{ 'is-bold': seg.bold }"
          >{{ seg.text }}</span>
        </p>

        <blockquote v-else-if="block.type === 'quote'">
          <span
            v-for="(seg, i) in block.segments"
            :key="i"
            :class="{ 'is-bold': seg.bold }"
          >{{ seg.text }}</span>
        </blockquote>

        <div v-else-if="block.type === 'li'" class="ai-li">
          <span class="ai-li-mark">{{ block.ordered ? '·' : '•' }}</span>
          <span class="ai-li-text">
            <span
              v-for="(seg, i) in block.segments"
              :key="i"
              :class="{ 'is-bold': seg.bold }"
            >{{ seg.text }}</span>
          </span>
        </div>

        <div v-else class="ai-gap"></div>
      </template>
    </div>

    <div v-if="attachments && attachments.length" class="ai-msg-attach">
      <span v-for="file in attachments" :key="file.id">
        {{ file.kind === 'image' ? '🖼️' : '📄' }} {{ file.name }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { parseRich } from '../../utils/rich.js'

const props = defineProps({
  role: { type: String, default: 'assistant' },
  name: { type: String, default: '助手' },
  content: { type: String, default: '' },
  attachments: { type: Array, default: () => [] },
  error: { type: Boolean, default: false },
  mock: { type: Boolean, default: false },
})

const blocks = computed(() => parseRich(props.content))
</script>
