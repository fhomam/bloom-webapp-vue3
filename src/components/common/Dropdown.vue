<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    
    <button 
      @click="toggleDropdown"
      :class="[
        'flex items-center focus:outline-none transition-all duration-200',
        variant === 'boxed' ? 'justify-between min-w-[130px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 hover:bg-slate-50' : '',
        variant === 'button' ? 'justify-between gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50' : '',
        variant === 'minimal' ? 'gap-1 text-sm text-slate-500 hover:text-slate-900' : ''
      ]"
    >
      <div v-if="variant === 'boxed'" class="flex flex-col flex-1 items-center justify-center text-center pr-2">
        <span class="text-[15px] font-bold text-slate-900 leading-tight">{{ selectedLabel }}</span>
        <span v-if="selectedSubLabel" class="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">{{ selectedSubLabel }}</span>
      </div>

      <span v-else-if="variant === 'button'" class="text-[14px] font-bold text-slate-900">
        {{ selectedLabel }}
      </span>

      <div v-else-if="variant === 'minimal'" class="flex items-center gap-1">
        <span v-if="prefix" class="font-normal">{{ prefix }}</span>
        <span class="font-bold text-slate-800">{{ selectedLabel }}</span>
      </div>

      <svg 
        :class="[
          'shrink-0 transition-transform duration-200', 
          variant === 'minimal' ? 'w-3.5 h-3.5 mt-0.5' : 'w-4 h-4 text-slate-600',
          isOpen ? 'rotate-180' : ''
        ]" 
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <Teleport to="body">
      <Transition 
        enter-active-class="transition ease-out duration-100" 
        enter-from-class="transform opacity-0 scale-95" 
        enter-to-class="transform opacity-100 scale-100" 
        leave-active-class="transition ease-in duration-75" 
        leave-from-class="transform opacity-100 scale-100" 
        leave-to-class="transform opacity-0 scale-95"
      >
        <div 
          v-show="isOpen" 
          :style="dropdownStyle"
          :class="[
            'fixed w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] py-1',
            alignmentClass
          ]"
        >
          <button
            v-for="option in options"
            :key="option.id"
            @click="selectOption(option)"
            :class="[
              'w-full px-4 py-2 transition-colors flex flex-col',
              variant === 'boxed' ? 'items-center justify-center text-center' : 'items-start text-left',
              modelValue === option.id ? 'bg-slate-50 text-bloom-primary' : 'text-slate-700 hover:bg-slate-50'
            ]"
          >
            <span :class="['text-[14px]', modelValue === option.id ? 'font-bold' : 'font-medium']">{{ option.label }}</span>
            <span v-if="option.subLabel && variant === 'boxed'" class="text-[11px] text-slate-500 mt-0.5">{{ option.subLabel }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  variant: { type: String, default: 'boxed' }, // 'boxed' | 'button' | 'minimal'
  prefix: { type: String, default: '' } // Only used in 'minimal'
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)
const alignmentClass = ref('left-0 origin-top-left') // Default fallback

const selectedOption = computed(() => props.options.find(o => o.id === props.modelValue))
const selectedLabel = computed(() => selectedOption.value?.label || 'Select...')
const selectedSubLabel = computed(() => selectedOption.value?.subLabel || '')

const dropdownStyle = ref({})

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    await nextTick()
    if (!dropdownRef.value) return

    const rect = dropdownRef.value.getBoundingClientRect()
    const windowWidth = window.innerWidth
    
    // Set the physical Top position (just below the button)
    dropdownStyle.value = { top: `${rect.bottom + 8}px` }

    if (props.variant === 'boxed') {
      alignmentClass.value = '-translate-x-1/2 origin-top'
      dropdownStyle.value.left = `${rect.left + (rect.width / 2)}px`
    } else if (rect.left > (windowWidth * 0.6)) {
      alignmentClass.value = 'origin-top-right'
      dropdownStyle.value.left = `${rect.right - 192}px` // 192px is w-48
    } else {
      alignmentClass.value = 'origin-top-left'
      dropdownStyle.value.left = `${rect.left}px`
    }
  }
}

const selectOption = (option) => {
  emit('update:modelValue', option.id)
  isOpen.value = false
}

const closeOnClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeOnClickOutside))
onUnmounted(() => document.removeEventListener('click', closeOnClickOutside))
</script>
