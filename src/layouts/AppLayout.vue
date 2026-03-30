<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden min-w-[320px]">
    
    <aside 
      :class="[
        ui.isLeftCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64',
        'absolute md:relative inset-y-0 left-0 flex flex-col bg-slate-950 text-slate-400 border-r border-slate-800 transition-all duration-300 ease-in-out z-50 shrink-0'
      ]"
    >
      <div class="h-14 flex items-center justify-between md:justify-center px-4 md:px-0 border-b border-slate-800 shrink-0">
        <div class="w-8 h-8 rounded bg-bloom-primary flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:bg-bloom-mono transition-colors" @click="ui.isLeftCollapsed = !ui.isLeftCollapsed">
          B
        </div>
        <button @click="ui.isLeftCollapsed = true" class="md:hidden text-slate-400 hover:text-white">✕</button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 hide-scrollbar">
        <RouterLink to="/" class="group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" active-class="bg-slate-800 text-white">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Dashboard</span>
        </RouterLink>
        </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
      
      <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30 w-full">
        <div class="flex items-center gap-3">
          <button @click="ui.isLeftCollapsed = false" class="md:hidden text-slate-500 hover:text-slate-900 mr-2">☰</button>
        </div>
        
        <div class="flex items-center gap-4">
          <button v-if="ui.rightTabs.length > 0" @click="ui.isRightOpen = !ui.isRightOpen" :class="['p-1.5 rounded-md transition-colors', ui.isRightOpen ? 'bg-bloom-primary text-white' : 'text-slate-400 hover:bg-slate-100']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden relative">
        <main class="flex-1 overflow-y-auto hide-scrollbar">
          <RouterView />
        </main>

        <div v-if="ui.isRightOpen" @click="ui.isRightOpen = false" class="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-sm"></div>

        <aside 
          :class="[
            ui.isRightOpen ? 'translate-x-0' : 'translate-x-full lg:w-0',
            'fixed lg:static inset-y-0 right-0 w-80 lg:border-l bg-slate-50 border-slate-200 transition-all duration-300 ease-in-out shrink-0 flex flex-col overflow-hidden z-40 shadow-2xl lg:shadow-none'
          ]"
        >
          <div class="flex border-b border-slate-200 shrink-0 min-w-[320px] bg-white">
            <button v-for="tab in ui.rightTabs" :key="tab.id" @click="ui.activeRightTab = tab.id" :class="['flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2', ui.activeRightTab === tab.id ? 'text-bloom-primary border-b-2 border-bloom-primary' : 'text-slate-500 hover:text-slate-800']">
              <span v-if="tab.icon" v-html="tab.icon" class="w-4 h-4"></span>
              {{ tab.label }}
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 hide-scrollbar min-w-[320px]">
             <div class="text-sm text-slate-500">Currently viewing: <strong class="text-slate-800">{{ ui.activeRightTab }}</strong> panel.</div>
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>