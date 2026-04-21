<template>
  <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white/50">
    <div class="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-5">
      <svg class="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h2 class="text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
    <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
      {{ message || 'We are having trouble connecting to the server. Please check your connection or try again.' }}
    </p>
    <button @click="retry" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      Retry
    </button>
  </div>
</template>

<script setup>
defineProps({
  message: String
})

const retry = () => {
  window.location.reload()
}
</script>