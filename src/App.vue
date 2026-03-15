<script setup>
import { onMounted } from 'vue';
import { useInvestmentStore } from './stores/investmentStore';
import { Sun, Moon } from 'lucide-vue-next';
import ControlPanel from './components/ControlPanel.vue';
import DashboardContainer from './components/DashboardContainer.vue';

const store = useInvestmentStore();

onMounted(() => {
  store.loadData();
  // Aplicar tema inicial baseado no localStorage
  if (store.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
</script>

<template>
  <div v-if="store.loading" class="flex items-center justify-center h-screen bg-slate-50">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-600 font-medium">Carregando Simulador...</p>
    </div>
  </div>
  
  <div v-else class="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-dark-bg transition-colors duration-500">
    <!-- Sidebar de Controles -->
    <aside class="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 overflow-y-auto max-h-screen sticky top-0 transition-colors duration-500">
      <ControlPanel />
    </aside>

    <!-- Área Principal do Dashboard -->
    <main class="flex-1 p-4 md:p-8 overflow-y-auto">
      <div class="max-w-6xl mx-auto">
        <header class="mb-8 flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Simula, Não Mula</h1>
            <p class="text-slate-500 dark:text-slate-400">Otimize seu futuro financeiro com inteligência.</p>
          </div>
          <button 
            @click="store.toggleDarkMode" 
            class="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-amber-400 hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <Sun v-if="store.isDarkMode" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
        </header>
        
        <DashboardContainer />

        <!-- Rodapé com Disclaimer -->
        <footer class="mt-12 py-8 border-t border-slate-200 dark:border-white/5 text-center px-4">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Rendimentos passados não são garantia de investimento futuro.
          </p>
          <p class="text-xs text-slate-400 dark:text-slate-500 max-w-2xl mx-auto leading-relaxed">
            O site não realiza nenhum tipo de recomendação de investimento. 
            Utilize as informações apresentadas exclusivamente para fins didáticos e simulações.
          </p>
        </footer>
      </div>
    </main>
  </div>
</template>
