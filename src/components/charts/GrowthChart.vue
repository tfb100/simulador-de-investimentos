<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useInvestmentStore } from '../../stores/investmentStore';

Chart.register(...registerables);

const store = useInvestmentStore();
const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (chartInstance) chartInstance.destroy();
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  
  const allDatasets = [];
  
  store.results.forEach((asset, assetIdx) => {
    // Dataset Principal (Linha Central)
    allDatasets.push({
      label: asset.name,
      data: asset.data,
      borderColor: asset.color,
      backgroundColor: asset.color + '10',
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
      segment: {
        borderColor: (ctx) => {
          const idx2025 = store.years.indexOf(2025);
          const isHistorical = ctx.p1DataIndex <= idx2025;
          if (isHistorical && store.isDarkMode) {
            return asset.color + '99'; // ~60% de opacidade para suavizar o passado no dark mode
          }
          return asset.color;
        },
        borderDash: (ctx) => {
          const idx2025 = store.years.indexOf(2025);
          return ctx.p1DataIndex > idx2025 ? [5, 5] : [];
        }
      }
    });

    // Adicionar Bandas de Cenário se existirem e estiverem ativas
    if (asset.scenarios && store.showScenarios) {
      allDatasets.push({
        label: `${asset.name} (Inf)`,
        data: asset.scenarios.lower,
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
        pointStyle: false, // Esconder da legenda indiretamente
        legend: { display: false }
      });

      allDatasets.push({
        label: `${asset.name} (Cenários)`,
        data: asset.scenarios.upper,
        borderColor: 'transparent',
        backgroundColor: asset.color + '15',
        fill: '-1', 
        pointRadius: 0,
        tension: 0.4,
        pointStyle: false,
        legend: { display: false }
      });
    }
  });

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: store.years.map(y => y > 2025 ? String(y) + ' (Proj.)' : (y === 2025 ? '2025*' : String(y))),
      datasets: allDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 15,
            color: store.isDarkMode ? '#94a3b8' : '#64748b',
            font: { size: 11, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: store.isDarkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.9)',
          titleColor: store.isDarkMode ? '#fff' : '#1e293b',
          bodyColor: store.isDarkMode ? '#94a3b8' : '#1e293b',
          borderColor: store.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            font: { size: 10 }, 
            color: store.isDarkMode ? '#475569' : '#94a3b8',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          grid: { 
            color: store.isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9',
            drawBorder: false
          },
          ticks: { 
            font: { size: 10 }, 
            color: store.isDarkMode ? '#475569' : '#94a3b8',
            callback: (value) => 'R$ ' + (value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'k')
          }
        }
      }
    }
  });
};

watch([() => store.results, () => store.isDarkMode], renderChart, { deep: true });

onMounted(renderChart);
onUnmounted(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>

<template>
  <div class="h-[400px] w-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
