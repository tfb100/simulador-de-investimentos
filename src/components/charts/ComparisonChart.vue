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
  
  // Calcular o total da carteira por ano
  const portfolioTotal = store.years.map((y, idx) => {
    return store.results.reduce((acc, asset) => acc + (asset.data[idx] || 0), 0);
  });

  // Pegar IBOV como benchmark
  const ibov = store.data ? store.data.IBOV : null;
  const ibovData = ibov ? store.years.map((y, idx) => {
    // Normalizar IBOV para iniciar no mesmo valor que o principal
    const p0 = ibov.p[store.startYear];
    return (ibov.p[y] / p0) * store.principal;
  }) : [];

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: store.years,
      datasets: [
        {
          label: 'Sua Carteira',
          data: portfolioTotal,
          borderColor: '#534AB7',
          backgroundColor: 'rgba(83, 74, 183, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 3
        },
        {
          label: 'Ibovespa (Normalizado)',
          data: ibovData,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          ticks: {
            callback: (v) => 'R$ ' + (v / 1000).toFixed(0) + 'k'
          }
        }
      }
    }
  });
};

watch(() => store.results, renderChart, { deep: true });
onMounted(renderChart);
onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });
</script>

<template>
  <div class="h-[400px] w-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
