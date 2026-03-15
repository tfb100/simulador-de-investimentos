<script setup>
import { computed } from 'vue';
import { useInvestmentStore } from '../../stores/investmentStore';
import { AlertTriangle, TrendingDown, Target } from 'lucide-vue-next';

const store = useInvestmentStore();

const riskStats = computed(() => {
  return store.results.map(asset => {
    const data = asset.data.filter(v => v !== null);
    if (data.length < 2) return null;

    let peak = data[0];
    let maxDrawdown = 0;
    let negYears = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i] > peak) peak = data[i];
      const dd = (data[i] - peak) / peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
      if (data[i] < data[i - 1]) negYears++;
    }

    return {
      name: asset.name,
      color: asset.color,
      maxDrawdown: (maxDrawdown * 100).toFixed(1) + '%',
      negYears,
      volatility: (negYears / data.length * 100).toFixed(0) + '%'
    };
  }).filter(Boolean);
});
</script>

<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="stat in riskStats" :key="stat.name" 
           class="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stat.color }"></div>
          <span class="font-bold text-slate-700 text-sm">{{ stat.name }}</span>
        </div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Máxima Queda</div>
            <div class="text-lg font-bold text-danger">{{ stat.maxDrawdown }}</div>
          </div>
          
          <div class="flex justify-between items-end">
            <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Anos Negativos</div>
            <div class="text-lg font-bold text-slate-700">{{ stat.negYears }}</div>
          </div>
          
          <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div class="h-full bg-danger transition-all duration-500" :style="{ width: stat.maxDrawdown }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
      <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0" />
      <div class="text-sm text-amber-800">
        <p class="font-bold mb-1">Entendendo o Risco</p>
        <p class="opacity-80 leading-relaxed">
          O "Drawdown" representa a maior queda que seu patrimônio teve desde o pico. 
          Investimentos com altos retornos (como Cripto) costumam ter quedas muito severas durante o percurso.
        </p>
      </div>
    </div>
  </div>
</template>
