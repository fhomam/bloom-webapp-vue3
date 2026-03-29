<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <button 
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-50 focus:outline-none"
    >
      <span class="text-slate-500 font-normal">{{ prefix }}</span>
      <span>{{ selectedLabel }}</span>
      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </button>

    <div 
      v-show="isOpen" 
      class="absolute right-0 mt-1 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1"
    >
      <button
        v-for="option in options"
        :key="option.id"
        @click="selectOption(option)"
        :class="[
          'w-full text-left px-4 py-2 text-sm transition-colors flex flex-col',
          modelValue === option.id ? 'bg-slate-50 text-bloom-primary font-semibold' : 'text-slate-700 hover:bg-slate-50'
        ]"
      >
        <span>{{ option.label }}</span>
        <span v-if="option.subLabel" class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{{ option.subLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  prefix: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedLabel = computed(() => {
  const selected = props.options.find(o => o.id === props.modelValue)
  return selected ? selected.label : 'Select...'
})

const selectOption = (option) => {
  emit('update:modelValue', option.id)
  isOpen.value = false
}

// Close when clicking outside
const closeOnClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeOnClickOutside))
onUnmounted(() => document.removeEventListener('click', closeOnClickOutside))
</script>
