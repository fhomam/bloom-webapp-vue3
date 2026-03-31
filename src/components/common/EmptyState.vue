<template>
  <div class="flex flex-col items-center justify-center p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl my-6 w-full">
    <span class="text-4xl mb-4 leading-none" aria-hidden="true">{{ icon }}</span>
    <h3 class="text-[17px] font-bold text-slate-800 tracking-tight">{{ title }}</h3>
    <p class="text-[14px] text-slate-500 mt-1.5 max-w-sm leading-relaxed">{{ message }}</p>
    
    <button 
      v-if="actionLabel" 
      @click="$emit('action')" 
      class="mt-6 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: 'No data found' },
  message: { type: String, default: 'We couldn\'t find anything matching your current criteria.' },
  actionLabel: { type: String, default: '' }
})

defineEmits(['action'])
</script>
