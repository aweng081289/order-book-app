<template>
  <div class="app-container flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-gray-100">
    <!-- Minimal Header -->
    <header class="w-full p-1 flex items-center justify-center bg-gray-800/50 backdrop-blur-md shadow">
      <img alt="Logo" class="logo rounded-full w-7 h-7 mr-2" src="./assets/logo.svg" />
      <span class="text-lg font-bold tracking-tight">Crypto Order Book</span>
    </header>
    <!-- Main Content Area -->
    <main class="w-full flex-1 h-full p-0 md:p-6 bg-transparent">
      <OrderBook :depth="5" />
    </main>
  </div>
</template>

<script setup>
import OrderBook from './components/OrderBook.vue';
</script>

<style scoped>
.logo {
  box-shadow: 0 4px 6px rgba(0,0,0,0.10);
}
</style>