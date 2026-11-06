<template>
  <div id="app-container">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { provide, ref } from 'vue'
import Toast from './components/Toast.vue'

const toastRef = ref(null)

function showToast (message, type = 'success') {
  toastRef.value?.add(message, type)
}

provide('showToast', showToast)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #070b14;
  color: #e6f2ff;
}

#app-container {
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
}

/* Page transition */
.page-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
