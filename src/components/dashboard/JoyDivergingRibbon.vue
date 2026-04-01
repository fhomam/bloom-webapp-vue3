<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center h-full w-full">
    
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Emotional Composition
      </h3>
      <span class="text-xs font-medium text-slate-400">Current Period</span>
    </div>

    <div class="w-full h-3 flex rounded-full overflow-hidden mb-6 bg-slate-100">
      <div :style="{ width: `${dimensions.hopelessness.value}%` }" class="bg-rose-500 transition-all duration-500" title="Hopelessness"></div>
      <div :style="{ width: `${dimensions.frustration.value}%` }" class="bg-orange-400 transition-all duration-500" title="Frustration"></div>
      <div :style="{ width: `${dimensions.engagement.value}%` }" class="bg-slate-300 transition-all duration-500" title="Engagement"></div>
      <div :style="{ width: `${dimensions.confidence.value}%` }" class="bg-blue-400 transition-all duration-500" title="Confidence"></div>
      <div :style="{ width: `${dimensions.joy.value}%` }" class="bg-emerald-400 transition-all duration-500" title="Joy"></div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div v-for="(dim, key) in dimensions" :key="key" class="flex flex-col">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-lg leading-none">{{ dim.emoji }}</span>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{{ dim.label }}</span>
        </div>
        <div class="flex items-end gap-2">
          <span class="text-lg font-bold text-slate-900 leading-none">{{ dim.value }}%</span>
          <span :class="['text-xs font-medium', dim.trend > 0 ? 'text-emerald-500' : 'text-slate-400']">
            {{ dim.trend > 0 ? '+' : '' }}{{ dim.trend }}%
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive } from 'vue'

// Mock Data - In reality, this will be computed from your Pinia Joy Score math
const dimensions = reactive({
  hopelessness: { label: 'Hopeless', emoji: '😔', value: 15, trend: -2 },
  frustration:  { label: 'Frustrated', emoji: '😤', value: 30, trend: +5 },
  engagement:   { label: 'Engaged', emoji: '👀', value: 20, trend: 0 },
  confidence:   { label: 'Confident', emoji: '😎', value: 15, trend: +1 },
  joy:          { label: 'Joyful', emoji: '✨', value: 20, trend: +4 }
})
</script>