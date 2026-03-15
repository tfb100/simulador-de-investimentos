<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useInvestmentStore } from '../../stores/investmentStore';

Chart.register(...registerables);

const store = useInvestmentStore();
const chartCanvas = ref(null);
const visualizationMode = ref('value'); // 'value', 'performance' ou 'initial'
let chartInstance = null;

const renderChart = () => {
  if (chartInstance) chartInstance.destroy();
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  
  // Pegar os valores para a distribuição
  const assets = store.results.filter(a => !a.isBenchmark);
  if (assets.length === 0) return;
  
  const finalValues = assets.map(asset => asset.data[asset.data.length - 1] || 0);
  const initialValues = assets.map(asset => asset.data[0] || 1);
  
  // Cálculo de Performance (%)
  const performanceValues = assets.map((asset, i) => {
    const startVal = initialValues[i];
    const endVal = finalValues[i];
    return ((endVal / startVal) - 1) * 100;
  });

  let displayData = [];
  let total = 0;

  if (visualizationMode.value === 'value') {
    displayData = finalValues;
    total = displayData.reduce((a, b) => a + b, 0);
  } else if (visualizationMode.value === 'performance') {
    displayData = performanceValues.map(v => Math.max(v, 0)); // Evitar fatias negativas no doughnut
    total = displayData.reduce((a, b) => a + b, 0);
  } else {
    // Modo Inicial (Alocação de Aporte) - Fatias RIGOROSAMENTE iguais
    displayData = assets.map(() => 100 / assets.length);
    total = 100;
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: assets.map((asset, i) => {
        const perf = performanceValues[i];
        if (visualizationMode.value === 'initial') return `${asset.name} (Alocação Inicial)`;
        return `${asset.name} (${perf >= 0 ? '+' : ''}${perf.toFixed(1)}%)`;
      }),
      datasets: [{
        data: displayData,
        backgroundColor: assets.map(asset => asset.color),
        borderWidth: 0,
        hoverOffset: 12,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            color: store.isDarkMode ? '#94a3b8' : '#64748b',
            font: { size: 11, weight: 'bold' }
          }
        },
        tooltip: {
          backgroundColor: store.isDarkMode ? '#1e293b' : '#fff',
          titleColor: store.isDarkMode ? '#fff' : '#1e293b',
          bodyColor: store.isDarkMode ? '#94a3b8' : '#475569',
          borderColor: store.isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const idx = context.dataIndex;
              const asset = assets[idx];
              const perf = performanceValues[idx];
              
              if (visualizationMode.value === 'value') {
                const val = finalValues[idx];
                const pct = ((val / finalValues.reduce((a,b)=>a+b,0)) * 100).toFixed(1) + '%';
                return ` ${asset.name}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)} (${pct})`;
              } else if (visualizationMode.value === 'performance') {
                return ` ${asset.name}: ${perf.toFixed(2)}% de rentabilidade`;
              } else {
                return ` ${asset.name}: Aporte Inicial de ${(100/assets.length).toFixed(1)}%`;
              }
            }
          }
        }
      },
      cutout: '72%'
    }
  });
};

watch([() => store.results, visualizationMode], renderChart, { deep: true });

onMounted(renderChart);
onUnmounted(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center">
    <!-- Toggle Moderno -->
    <div class="flex items-center gap-2 mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start">
      <button 
        @click="visualizationMode = 'initial'"
        :class="[
          'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300',
          visualizationMode === 'initial' 
            ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        ]"
      >
        Aporte ({{ (100 / (store.results.filter(a => !a.isBenchmark).length || 1)).toFixed(0) }}%)
      </button>
      <button 
        @click="visualizationMode = 'value'"
        :class="[
          'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300',
          visualizationMode === 'value' 
            ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        ]"
      >
        Patrimônio Final
      </button>
      <button 
        @click="visualizationMode = 'performance'"
        :class="[
          'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300',
          visualizationMode === 'performance' 
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        ]"
      >
        Rentabilidade (%)
      </button>
    </div>

    <!-- Container do Gráfico -->
    <div class="relative w-full flex-1 min-h-[300px]">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>
