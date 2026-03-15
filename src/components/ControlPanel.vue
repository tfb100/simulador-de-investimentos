<script setup>
import { ref, computed } from 'vue';
import { useInvestmentStore } from '../stores/investmentStore';
import { 
  Settings2,
  TrendingUp,
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Info,
  Wallet
} from 'lucide-vue-next';

const store = useInvestmentStore();
const showAdvanced = ref(false);
const showAssetPicker = ref(false);
const activeCategory = ref('Ações');

const categories = {
  'Ações': 'STOCKS',
  'Renda Fixa': 'RF',
  'Cripto': 'CRYPTO',
  'Commodities': 'COMM'
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const updateValue = () => {
  store.calculate();
};

const isAssetSelected = (cat, key) => {
  if (cat === 'Ações') return store.selectedStocks.includes(key);
  if (cat === 'Renda Fixa') return store.selectedRF.includes(key);
  if (cat === 'Cripto') return store.selectedCrypto.includes(key);
  if (cat === 'Commodities') return store.selectedComm.includes(key);
  return false;
};

const toggleAsset = (cat, key) => {
  let target;
  if (cat === 'Ações') target = store.selectedStocks;
  else if (cat === 'Renda Fixa') target = store.selectedRF;
  else if (cat === 'Cripto') target = store.selectedCrypto;
  else if (cat === 'Commodities') target = store.selectedComm;
  
  const idx = target.indexOf(key);
  if (idx > -1) target.splice(idx, 1);
  else target.push(key);
  
  updateValue();
};

const applyPreset = (type) => {
  if (type === 'conservador') {
    store.selectedStocks = [];
    store.selectedRF = ['CDB', 'SELIC', 'LCI', 'POUPANCA'];
    store.selectedCrypto = [];
    store.selectedComm = [];
    store.showIBOV = false;
  } else if (type === 'equilibrado') {
    store.selectedStocks = ['ITUB4', 'WEGE3'];
    store.selectedRF = ['CDB', 'SELIC'];
    store.selectedCrypto = ['BTC'];
    store.selectedComm = ['OURO'];
    store.showIBOV = false;
  } else if (type === 'agressivo') {
    store.selectedStocks = ['WEGE3', 'PETR4', 'VALE3'];
    store.selectedRF = ['CDB'];
    store.selectedCrypto = ['BTC', 'ETH', 'SOL'];
    store.selectedComm = ['OURO', 'CAFE'];
    store.showIBOV = true;
  }
  updateValue();
};

const selectedAssetsList = computed(() => {
  const list = [];
  if (!store.data) return list;
  store.selectedStocks.forEach(k => list.push({ key: k, cat: 'Ações', name: store.data.STOCKS[k].short, color: store.data.STOCKS[k].color }));
  store.selectedRF.forEach(k => list.push({ key: k, cat: 'Renda Fixa', name: store.data.RF[k].short, color: store.data.RF[k].color }));
  store.selectedCrypto.forEach(k => list.push({ key: k, cat: 'Cripto', name: store.data.CRYPTO[k].short, color: store.data.CRYPTO[k].color }));
  store.selectedComm.forEach(k => list.push({ key: k, cat: 'Commodities', name: store.data.COMM[k].short, color: store.data.COMM[k].color }));
  if (store.showIBOV) list.push({ key: 'IBOV', cat: 'Benchmark', name: 'IBOVESPA', color: '#888' });
  return list;
});

const handleUiModeChange = (mode) => {
  store.uiMode = mode;
  if (mode === 'basic' && store.basicSimulationMode === 'assets') {
    // Ao entrar no modo básico por ativos, garantimos apenas renda fixa por padrão
    store.selectedStocks = [];
    store.selectedCrypto = [];
    store.selectedComm = [];
    // Seleciona todos os produtos de Renda Fixa disponíveis na Store
    if (store.data && store.data.RF) {
      store.selectedRF = Object.keys(store.data.RF);
    } else {
      // Fallback caso os dados ainda não tenham carregado
      store.selectedRF = ['CDB', 'SELIC', 'LCI', 'POUPANCA', 'IPCAP'];
    }
    store.showIBOV = false;
  }
  updateValue();
};
</script>

<template>
  <div class="p-6 space-y-8 pb-32">
    <!-- Header Simples -->
    <header class="mb-4">
      <div class="flex items-center gap-2 mb-1 text-primary dark:text-primary-light font-bold text-lg">
        <Wallet class="w-5 h-5" />
        Simulador
      </div>
      <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Inicie sua estratégia</p>
    </header>

    <!-- Seletor de Abas (Segment Control) -->
    <div class="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
      <button 
        v-for="mode in [{id: 'basic', label: 'Básico'}, {id: 'advanced', label: 'Avançado'}]" 
        :key="mode.id"
        @click="handleUiModeChange(mode.id)"
        :class="[
          'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all',
          store.uiMode === mode.id 
            ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-light shadow-sm scale-[1.02]' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        ]"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- Seletor de Metodologia (Apenas Modo Básico) -->
    <section v-if="store.uiMode === 'basic'" class="animate-in fade-in slide-in-from-top-1 duration-300">
      <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Metodologia</label>
      <div class="flex p-1 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
        <button 
          @click="store.basicSimulationMode = 'assets'; handleUiModeChange('basic')"
          :class="[
            'flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all',
            store.basicSimulationMode === 'assets' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          ]"
        >
          Ativos Reais
        </button>
        <button 
          @click="store.basicSimulationMode = 'manual'; updateValue()"
          :class="[
            'flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all',
            store.basicSimulationMode === 'manual' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          ]"
        >
          Taxa Fixa
        </button>
      </div>
    </section>

    <!-- 1. Presets (Apenas Avançado) -->
    <section v-if="store.uiMode === 'advanced'" class="animate-in fade-in slide-in-from-top-2 duration-300">
      <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Qual seu perfil?</label>
      <div class="grid grid-cols-3 gap-2">
        <button 
          v-for="p in ['Conservador', 'Equilibrado', 'Agressivo']" 
          :key="p"
          @click="applyPreset(p.toLowerCase())"
          class="py-3 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-bold transition-all bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-primary dark:hover:border-primary-light hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-primary-light active:scale-95 shadow-sm"
        >
          {{ p }}
        </button>
      </div>
    </section>

    <!-- 2. Inputs Principais -->
    <section class="space-y-6">
      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
          Investimento Inicial
          <span class="text-primary dark:text-primary-light font-bold">{{ formatCurrency(store.principal) }}</span>
        </label>
        <input 
          type="range" 
          v-model.number="store.principal" 
          min="1000" 
          max="1000000" 
          step="1000"
          @input="updateValue"
          class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
          Início do investimento
          <span class="text-primary dark:text-primary-light font-bold">{{ store.startYear }}</span>
        </label>
        <input 
          type="range" 
          v-model.number="store.startYear" 
          min="2005" 
          max="2026" 
          step="1"
          @input="updateValue"
          class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
          Fim do investimento
          <span class="text-primary dark:text-primary-light font-bold">{{ store.endYear }}</span>
        </label>
        <input 
          type="range" 
          v-model.number="store.endYear" 
          min="2027" 
          max="2100" 
          step="1"
          @input="updateValue"
          class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      <!-- Taxa Manual (Apenas Modo Básico Manual) -->
      <div v-if="store.uiMode === 'basic' && store.basicSimulationMode === 'manual'" class="pt-4 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
          Rentabilidade Esperada
          <span class="text-primary dark:text-primary-light font-bold">{{ (store.manualRate * 100).toFixed(1) }}% <span class="text-[10px] opacity-70">a.a</span></span>
        </label>
        <input 
          type="range" 
          v-model.number="store.manualRate" 
          min="0" 
          max="0.3" 
          step="0.005"
          @input="updateValue"
          class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p class="mt-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
          *Nesta modalidade, o simulador ignora flutuações históricas e aplica uma taxa fixa linear.
        </p>
      </div>
    </section>

    <!-- 3. Seleção de Ativos (Oculto se Modo Básico Manual) -->
    <section v-if="store.uiMode === 'advanced' || (store.uiMode === 'basic' && store.basicSimulationMode === 'assets')" class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sua Carteira</label>
        <button 
          @click="showAssetPicker = true"
          class="flex items-center gap-1 text-[10px] font-bold text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus class="w-3 h-3" /> ADICIONAR
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <div 
          v-for="asset in selectedAssetsList" 
          :key="asset.key"
          class="flex items-center gap-2 pl-2 pr-1 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg shadow-sm animate-in fade-in zoom-in duration-200"
        >
          <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200">{{ asset.name }}</span>
          <button 
            @click="asset.key === 'IBOV' ? store.showIBOV = false : toggleAsset(asset.cat, asset.key)"
            class="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 hover:text-danger dark:hover:text-danger"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
        <div v-if="selectedAssetsList.length === 0" class="w-full py-4 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-center border border-dashed border-slate-300 dark:border-white/10">
          <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Nenhum ativo selecionado</p>
        </div>
      </div>
    </section>

    <!-- 4. Configurações Avançadas (Apenas Modo Avançado) -->
    <section v-if="store.uiMode === 'advanced'" class="pt-4 border-t border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
        <Settings2 class="w-4 h-4" /> Personalização Avançada
      </div>

      <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-4">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" v-model="store.monthlyEnabled" @change="updateValue" class="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-primary" />
          <div class="flex flex-col">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Aporte Mensal</span>
            <span class="text-[9px] text-slate-400 dark:text-slate-500">Quanto você investe a mais por mês?</span>
          </div>
        </label>
        
        <div v-if="store.monthlyEnabled" class="pl-7">
          <div class="relative">
            <span class="absolute left-3 top-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold">R$</span>
            <input 
              type="number" 
              v-model.number="store.monthlyValue" 
              @input="updateValue"
              class="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" v-model="store.reinvest" @change="updateValue" class="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-primary" />
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Reinvestir dividendos</span>
        </label>

        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" v-model="store.afterTax" @change="updateValue" class="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-primary" />
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Renda fixa após IR</span>
        </label>

        <label class="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" v-model="store.realAdjusted" @change="updateValue" class="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-primary" />
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Ajustar inflação (IPCA)</span>
        </label>

        <!-- Seção de Projeções Futuras -->
        <div class="pt-2 border-t border-slate-200 dark:border-white/5 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expectativa Futura (2026+)</span>
            <label class="flex items-center gap-2 cursor-pointer">
              <span class="text-[9px] font-bold text-slate-400">Cenários</span>
              <input type="checkbox" v-model="store.showScenarios" @change="updateValue" class="w-3 h-3 rounded border-slate-300 dark:border-white/10 text-primary" />
            </label>
          </div>

          <div class="space-y-3">
            <div v-for="(rate, key) in { RV: 'Ações', RF: 'Renda Fixa', CR: 'Cripto' }" :key="key">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">{{ rate }}</span>
                <span class="text-[10px] font-bold text-primary dark:text-primary-light">{{ (store.futureRates[key] * 100).toFixed(1) }}% <span class="text-[8px] opacity-70">a.a</span></span>
              </div>
              <input 
                type="range" 
                v-model.number="store.futureRates[key]" 
                min="0" 
                max="0.5" 
                step="0.005"
                @input="updateValue"
                class="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal Seletor de Ativos -->
    <Teleport to="body">
      <div v-if="showAssetPicker && store.data" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div @click="showAssetPicker = false" class="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-white/10 animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 class="font-bold text-slate-800 dark:text-white">Escolha seus Ativos</h3>
            <button @click="showAssetPicker = false" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X class="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          
          <div class="flex border-b border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-slate-800/30 overflow-x-auto no-scrollbar">
            <button 
              v-for="(val, cat) in categories" 
              :key="cat"
              @click="activeCategory = cat"
              :class="[
                'px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                activeCategory === cat 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              ]"
            >
              {{ cat }}
            </button>
            <button 
              @click="activeCategory = 'Benchmarks'"
              :class="[
                'px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                activeCategory === 'Benchmarks' 
                  ? 'border-primary text-primary dark:text-primary-light' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              ]"
            >
              Benchmarks
            </button>
          </div>
  
          <div class="p-6 max-h-[400px] overflow-y-auto dark:bg-slate-900/50">
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <template v-if="activeCategory !== 'Benchmarks'">
                <button 
                  v-for="(asset, key) in store.data[categories[activeCategory]]" 
                  :key="key"
                  @click="toggleAsset(activeCategory, key)"
                  :class="[
                    'px-3 py-2 rounded-xl text-[10px] font-bold border transition-all text-center h-12 flex items-center justify-center leading-tight',
                    isAssetSelected(activeCategory, key)
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  ]"
                >
                  {{ asset.short }}
                </button>
              </template>
              <template v-else>
                <button 
                  @click="store.showIBOV = !store.showIBOV; updateValue()"
                  :class="[
                    'px-3 py-2 rounded-xl text-[10px] font-bold border transition-all text-center h-12 flex items-center justify-center leading-tight',
                    store.showIBOV
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  ]"
                >
                  IBOVESPA
                </button>
              </template>
            </div>
          </div>
  
          <div class="p-4 bg-slate-50 dark:bg-slate-800/80 border-t dark:border-white/10 flex justify-end">
            <button 
              @click="showAssetPicker = false"
              class="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
