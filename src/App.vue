<template>
  <div
    class="app-container flex min-h-screen flex-col bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100"
    :inert="activeOverlay ? true : undefined"
    :aria-hidden="activeOverlay ? 'true' : undefined"
  >
    <header class="grid w-full grid-cols-[1fr_auto_1fr] items-center bg-gray-800/50 px-3 py-2 shadow backdrop-blur-md">
      <div aria-hidden="true"></div>
      <div class="flex items-center justify-self-center">
        <img alt="" class="logo mr-2 h-7 w-7 rounded-full" src="./assets/logo.svg" />
        <span class="hidden text-lg font-bold tracking-tight sm:inline">Crypto Order Book</span>
      </div>
      <nav class="flex items-center gap-1 justify-self-end" aria-label="Project navigation">
        <button class="nav-link" type="button" @click="openOverlay('about')">About</button>
        <button class="nav-link" type="button" @click="openOverlay('changelog')">Changelog</button>
      </nav>
    </header>

    <main class="h-full w-full flex-1 bg-transparent p-0 md:p-6">
      <OrderBook :depth="5" />
    </main>
  </div>

  <ProjectOverlay
    v-if="activeOverlay"
    :view="activeOverlay"
    @close="closeOverlay"
    @change-view="openOverlay"
  />
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import OrderBook from './components/OrderBook.vue';
import ProjectOverlay from './components/ProjectOverlay.vue';

const activeOverlay = ref('about');

function openOverlay(view) {
  activeOverlay.value = view;
}

function closeOverlay() {
  activeOverlay.value = null;
}

function handleKeydown(event) {
  if (event.key === 'Escape' && activeOverlay.value) closeOverlay();
}

watch(activeOverlay, value => {
  document.body.style.overflow = value ? 'hidden' : '';
}, { immediate: true });

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.logo { box-shadow: 0 4px 6px rgb(0 0 0 / 10%); }
.nav-link {
  border-radius: 0.375rem;
  color: #c7d2fe;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.55rem;
  transition: background-color 150ms, color 150ms;
}
.nav-link:hover { background-color: rgb(55 65 81 / 80%); color: white; }
</style>
