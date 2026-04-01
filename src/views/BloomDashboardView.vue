<template>
  <div class="p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <DashboardCommandRibbon class="col-span-1 lg:col-span-3" />

      <div class="col-span-1 lg:col-span-2">
        <ExecutiveSummaryStats />
      </div>

      <div class="col-span-1 lg:col-span-1">
        <TopTaxonomyWidget />
      </div>      

      <div class="col-span-1 lg:col-span-3">
        <PrimaryTrendChart />
      </div>

      <div class="col-span-1 lg:col-span-1">
        <JoyDivergingRibbon />
      </div>

      <div class="col-span-1 lg:col-span-2">
        <JoySparklinesList />
      </div>
    </div>
  </div>
</template>

<script setup>
// In a real scenario, Pinia getters would be imported here and passed down as props
import DashboardCommandRibbon from '@/components/dashboard/DashboardCommandRibbon.vue'
import PrimaryTrendChart from '@/components/dashboard/PrimaryTrendChart.vue'
import JoyDivergingRibbon from '@/components/dashboard/JoyDivergingRibbon.vue'
import JoySparklinesList from '@/components/dashboard/JoySparklinesList.vue'
import ExecutiveSummaryStats from '@/components/dashboard/ExecutiveSummaryStats.vue'
import TopTaxonomyWidget from '@/components/dashboard/TopTaxonomyWidget.vue'


</script>
