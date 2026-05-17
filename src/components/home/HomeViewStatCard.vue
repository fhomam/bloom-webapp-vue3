<template>
  <div
    :class="[
      'group bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-3 lg:p-5 xl:p-6 shadow-sm flex flex-col justify-between lg:min-h-[120px] transition-colors',
      flippable ? 'cursor-pointer hover:border-slate-300' : '',
    ]"
    :role="flippable ? 'button' : undefined"
    :tabindex="flippable ? 0 : undefined"
    @click="handleFlip"
    @keydown.enter.prevent="handleFlip"
    @keydown.space.prevent="handleFlip"
  >
    <!-- Header: label (+ optional sync dot) + icon -->
    <div class="flex items-start justify-between w-full mb-2 lg:mb-3 gap-2">
      <div class="flex items-center gap-1.5 min-w-0 mt-0.5 lg:mt-1">
        <span class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
          {{ activeLabel }}
        </span>
        <span v-if="!isFlipped && syncStatus" class="relative flex h-1.5 w-1.5 shrink-0" :title="syncStatus.label">
          <span :class="[syncStatus.pingColor, 'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75']"></span>
          <span :class="[syncStatus.dotColor, 'relative inline-flex rounded-full h-1.5 w-1.5']"></span>
        </span>
      </div>
      <div
        :class="[
          'w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300',
          activeIconBgClass,
          activeIconTextClass,
          flippable ? 'group-hover:-scale-x-100' : '',
          isFlipped ? '-scale-x-100' : '',
        ]"
      >
        <component :is="iconComponent" class="w-3 h-3 lg:w-4 lg:h-4" />
      </div>
    </div>

    <!-- Body: stats -->
    <div :class="{ 'opacity-50 transition-opacity': loading }">
      <div class="flex items-baseline gap-x-1.5 lg:gap-x-2 flex-wrap gap-y-1">
        <!-- Primary value (number or string e.g. '5d') -->
        <span class="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
          {{ displayPrimary }}
        </span>

        <!-- Secondary value (fused mode, hidden at lg+) -->
        <span
          v-if="activeSecondaryValue !== null && activeSecondaryValue !== undefined"
          class="lg:hidden text-sm font-semibold text-slate-400 leading-none"
        >
          / {{ formatCompactNumber(Number(activeSecondaryValue)) }}
        </span>

        <!-- Unit label (lg+ only when fused; always shown when single) -->
        <span
          v-if="activeUnit"
          :class="[
            activeSecondaryValue !== null && activeSecondaryValue !== undefined ? 'hidden lg:inline' : '',
            'text-[10px] lg:text-[11px] xl:text-xs font-semibold text-slate-500',
          ]"
        >
          {{ activeUnit }}
        </span>

        <!-- Change pill -->
        <span
          v-if="!isFlipped && change && change.show"
          :class="['text-[10px] font-bold px-1.5 py-0.5 rounded leading-none', change.classes]"
        >
          {{ change.label }}
        </span>
        <span
          v-if="!isFlipped && syncStatus"
          class="text-[10px] lg:text-[11px] xl:text-xs font-semibold text-slate-500"
        >
          {{ syncStatus.label }}
        </span>
      </div>

      <!-- Sub-label (sm+ only; hidden on tightest mobile) -->
      <span
        v-if="activeSubLabel"
        class="hidden sm:block lg:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1.5"
      >
        {{ activeSubLabel }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref } from 'vue'
import { formatCompactNumber } from '@/library/utils'

const props = defineProps({
  // Front face
  label: { type: String, required: true },
  primaryValue: { type: [Number, String], required: true },
  secondaryValue: { type: [Number, String], default: null },
  unit: { type: String, default: '' },
  subLabel: { type: String, default: '' },

  // Icon (shared between faces)
  iconPath: { type: String, default: '' },
  iconStrokeWidth: { type: [Number, String], default: 2 },
  iconBgClass: { type: String, default: 'bg-slate-50' },
  iconTextClass: { type: String, default: 'text-slate-400' },

  // Optional decorations (front face only)
  change: { type: Object, default: null },
  syncStatus: { type: Object, default: null },

  // Loading
  loading: { type: Boolean, default: false },

  // Back face (any of these turns the card into a flippable)
  flippable: { type: Boolean, default: false },
  backLabel: { type: String, default: '' },
  backPrimaryValue: { type: [Number, String], default: null },
  backSecondaryValue: { type: [Number, String], default: null },
  backUnit: { type: String, default: '' },
  backSubLabel: { type: String, default: '' },
  backIconBgClass: { type: String, default: '' },
  backIconTextClass: { type: String, default: '' },
  // If true, display primaryValue as-is (no compact number formatting) — useful for strings like "5d ago"
  backPrimaryRaw: { type: Boolean, default: false },
})

const isFlipped = ref(false)

const handleFlip = () => {
  if (props.flippable) isFlipped.value = !isFlipped.value
}

// Resolve which face's values to show
const activeLabel = computed(() => isFlipped.value && props.backLabel ? props.backLabel : props.label)
const activeUnit = computed(() => isFlipped.value && props.backUnit ? props.backUnit : props.unit)
const activeSubLabel = computed(() => isFlipped.value && props.backSubLabel ? props.backSubLabel : props.subLabel)
const activeSecondaryValue = computed(() =>
  isFlipped.value ? props.backSecondaryValue : props.secondaryValue
)
const activeIconBgClass = computed(() =>
  isFlipped.value && props.backIconBgClass ? props.backIconBgClass : props.iconBgClass
)
const activeIconTextClass = computed(() =>
  isFlipped.value && props.backIconTextClass ? props.backIconTextClass : props.iconTextClass
)

// Primary display handles both numeric formatting and raw string passthrough
const displayPrimary = computed(() => {
  if (isFlipped.value) {
    const v = props.backPrimaryValue
    if (v === null || v === undefined) return '—'
    if (props.backPrimaryRaw) return v
    return formatCompactNumber(Number(v))
  }
  return formatCompactNumber(Number(props.primaryValue))
})

const iconComponent = {
  render() {
    return h('svg', {
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': props.iconStrokeWidth,
        d: props.iconPath,
      })
    ])
  }
}
</script>