<script setup>
import { ref, computed } from 'vue';
import { useInvestmentStore } from '../stores/investmentStore';
import { 
  TrendingUp, 
  PieChart, 
  AlertTriangle, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet
} from 'lucide-vue-next';
import GrowthChart from './charts/GrowthChart.vue';
import DiversificationChart from './charts/DiversificationChart.vue';
import RiskAnalysis from './charts/RiskAnalysis.vue';
import ComparisonChart from './charts/ComparisonChart.vue';

const store = useInvestmentStore();
const activeTab = ref('growth');

const tabs = [
  { id: 'growth', label: 'Crescimento', icon: TrendingUp },
  { id: 'diversification', label: 'Diversificação', icon: PieChart },
  { id: 'risk', label: 'Análise de Risco', icon: AlertTriangle },
  { id: 'comparison', label: 'Comparação', icon: BarChart3 }
];

const totalPortfolio = computed(() => {
  if (store.results.length === 0) return 0;
  return store.results
    .filter(asset => !asset.isBenchmark)
    .reduce((acc, asset) => {
      const lastVal = asset.data[asset.data.length - 1] || 0;
      return acc + lastVal;
    }, 0);
});

const portfolioAssets = computed(() => {
  return store.results.filter(asset => !asset.isBenchmark);
});

const portfolioPerformance = computed(() => {
  const investido = store.principal + (store.monthlyEnabled ? store.monthlyValue * (store.endYear - store.startYear) * 12 : 0);
  if (investido <= 0) return 0;
  return ((totalPortfolio.value / investido) - 1) * 100;
});

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header com Resumo Executivo -->
    <header class="glass-panel p-6 rounded-3xl transition-all duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Patrimônio em {{ store.endYear }}</h2>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-3xl font-black text-primary dark:text-primary-light">{{ formatCurrency(totalPortfolio) }}</span>
            <div 
              class="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold"
              :class="portfolioPerformance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'"
            >
              <component :is="portfolioPerformance >= 0 ? ArrowUpRight : ArrowDownRight" class="w-3 h-3" />
              {{ portfolioPerformance.toFixed(1) }}%
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-slate-900/5 dark:bg-white/5 p-4 rounded-2xl border border-slate-900/5 dark:border-white/5">
          <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Sparkles class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug font-medium max-w-[200px]">
            Seu rendimento foi de <span class="font-bold text-slate-800 dark:text-slate-200 text-xs">{{ formatCurrency(totalPortfolio - store.principal) }}</span> 
            sobre o capital inicial.
          </p>
        </div>
      </div>
    </header>

    <!-- Navegação (Tabs Estilo Glass) -->
    <nav class="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl inline-flex gap-1 border border-slate-200/50 dark:border-white/10 backdrop-blur-sm shadow-inner overflow-x-auto max-w-full">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 whitespace-nowrap',
          activeTab === tab.id 
            ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm shadow-primary/10 scale-100' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
        ]"
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
      </button>
    </nav>

    <!-- Cards de Ativos -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="asset in portfolioAssets.slice(0, 4)" 
        :key="asset.name"
        class="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 p-5 rounded-3xl shadow-lg shadow-slate-200/40 dark:shadow-black/20 hover:scale-[1.02] transition-transform duration-300"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-[9px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500">{{ asset.name }}</span>
          <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: asset.color }"></div>
        </div>
        <div class="text-xl font-black text-slate-800 dark:text-slate-100">{{ formatCurrency(asset.data[asset.data.length - 1]) }}</div>
        <p class="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider">Valor Projetado</p>
      </div>
    </div>

    <!-- Área Principal Conteúdo -->
    <main class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-white/10 p-8 rounded-[2rem] shadow-2xl shadow-slate-300/30 dark:shadow-black/40 min-h-[480px] transition-all duration-500">
      <div v-if="activeTab === 'growth'" class="space-y-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Evolução Histórica</h3>
          <div class="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
             <div class="flex items-center gap-1"><div class="w-2 h-0.5 bg-primary"></div> Carteira</div>
             <div class="flex items-center gap-1"><div class="w-2 h-0.5 bg-slate-300 dark:bg-slate-700 border-t border-dashed"></div> IBOV</div>
          </div>
        </div>
        <GrowthChart />
      </div>
      
      <div v-else-if="activeTab === 'diversification'" class="space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Alocação e Performance</h3>
            <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">Comparação baseada em aportes rigorosamente iguais para cada ativo.</p>
          </div>
          <div v-if="portfolioAssets.length > 0" class="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
            <Sparkles class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              Destaque: Investimentos divididos igualmente para análise de performance.
            </span>
          </div>
        </div>
        <div class="h-[400px]">
          <DiversificationChart />
        </div>
      </div>

      <div v-else-if="activeTab === 'risk'" class="space-y-4">
        <h3 class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 text-center">Resiliência e Quedas</h3>
        <RiskAnalysis />
      </div>

      <div v-else-if="activeTab === 'comparison'" class="space-y-4">
        <h3 class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-2">Performance vs Benchmark</h3>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 font-medium max-w-md leading-relaxed">Considerando o aporte inicial e as correções selecionadas.</p>
        <ComparisonChart />
      </div>
    </main>
  </div>
</template>
