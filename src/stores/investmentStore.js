import { defineStore } from 'pinia'

export const useInvestmentStore = defineStore('investment', {
  state: () => ({
    // Dados brutos
    data: null,
    loading: true,
    error: null,

    // Configurações do usuário
    principal: 10000,
    startYear: 2026,
    reinvest: true,
    afterTax: true,
    cryptoTax: false,
    monthlyEnabled: false,
    monthlyValue: 500,
    realAdjusted: false,
    goalValue: 1000000,
    goalYear: 2027,
    endYear: 2027, // Novo: Ano final da simulação (até 2100)
    
    // Configurações de Projeção (Opção 2)
    futureRates: {
      RV: 0.10,   // 10% a.a
      RF: 0.08,   // 8% a.a
      CR: 0.15,   // 15% a.a
      CM: 0.05    // 5% a.a
    },
    showScenarios: false, // Opção 3

    // Seleções de ativos
    selectedStocks: [],
    selectedRF: ['CDB', 'SELIC', 'LCI', 'POUPANCA', 'IPCAP'],
    selectedCrypto: [],
    selectedComm: [],
    showIBOV: false,

    // Resultados
    results: [],
    years: [],

    // Preferências de UI
    uiMode: 'basic', // 'basic' ou 'advanced'
    basicSimulationMode: 'assets', // 'assets' ou 'manual'
    manualRate: 0.10, // 10% a.a padrão para modo manual
    isDarkMode: localStorage.getItem('theme') === 'dark',
  }),

  getters: {
    inflFactor: (state) => (year) => {
      if (!state.data || !state.data.IPCA) return 1
      const years = state.data.YEARS
      const ipca = state.data.IPCA
      
      const cumInfl = {}
      let acc = 1
      years.forEach((y, i) => {
        if (i === 0) {
          cumInfl[y] = 1
          return
        }
        acc *= 1 + ipca[y]
        cumInfl[y] = acc
      })
      
      return (cumInfl[2025] || acc) / (cumInfl[year] || 1)
    }
  },

  actions: {
    async loadData() {
      try {
        const res = await fetch('/simulador-data.json')
        if (!res.ok) throw new Error('Falha ao carregar dados')
        this.data = await res.json()
        this.years = this.data.YEARS
        this.loading = false
        this.calculate()
      } catch (err) {
        this.error = err.message
        this.loading = false
      }
    },

    calculate() {
      const { YEARS, STOCKS, RF, CRYPTO, COMM, IBOV, CDI, IPCA, FX } = this.data
      const start = this.startYear
      const end = this.endYear
      
      // Gerar lista de anos dinamicamente de START até END
      let allYrs = []
      for (let y = start; y <= end; y++) {
        allYrs.push(y)
      }
      
      const assets = []
      
      // Contar número de ativos na CARTEIRA (não conta IBOV)
      const numAssets = this.selectedStocks.length + this.selectedRF.length + 
                        this.selectedCrypto.length + this.selectedComm.length
      
      // Se não houver ativos, não há o que calcular
      if (numAssets === 0 && !this.showIBOV) {
        this.results = []
        this.years = allYrs
        return
      }

      // Dividir capital pela quantidade de ativos
      const principalPerAsset = numAssets > 0 ? this.principal / numAssets : this.principal
      const monthlyPerAsset = (this.monthlyEnabled && numAssets > 0) ? this.monthlyValue / numAssets : 0
      const annualContribPerAsset = monthlyPerAsset * 12

      // Lógicas de cálculo corrigidas para usar valores por ativo
      const calcRV = (k, P, contrib) => {
        const s = STOCKS[k]
        let v = P
        return allYrs.map((y, i) => {
          if (i === 0) return Math.round(v)
          const py = allYrs[i - 1]
          
          let r = 0
          if (y <= 2025) {
            r = ((s.p[y] - s.p[py]) / s.p[py]) + (this.reinvest ? s.d[y] : 0)
          } else {
            r = this.futureRates.RV
          }
          
          v = v * (1 + r) + contrib
          return Math.round(v)
        })
      }

      const calcRF = (k, P, contrib) => {
        const a = RF[k]
        let v = P
        return allYrs.map((y, i) => {
          if (i === 0) return Math.round(v)
          
          if (y > 2025) {
            const r = this.futureRates.RF
            const interest = v * r
            v = (!this.afterTax || !a.taxable) ? v + interest : v + interest * 0.85 
            v += contrib
          } else if (a.r.type === 'historical') {
            const annualRate = a.r.values[y] || 0
            const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1
            const monthlyContrib = contrib / 12
            for (let m = 0; m < 12; m++) {
              v = v * (1 + monthlyRate) + monthlyContrib
            }
          } else {
            const r = a.r.type === 'cdi' 
              ? (CDI[y] || 0) * a.r.factor 
              : (1 + (IPCA[y] || 0)) * (1 + a.r.real) - 1
            
            const interest = v * r
            const irR = (idx) => idx <= 1 ? 0.20 : idx <= 2 ? 0.175 : 0.150
            v = (!this.afterTax || !a.taxable) ? v + interest : v + interest * (1 - irR(i))
            v += contrib
          }
          
          return Math.round(v)
        })
      }

      const calcCR = (k, P, contrib) => {
        const c = CRYPTO[k]
        const eff = Math.max(start, c.from || 2011)
        
        // Inicialização robusta para anos futuros
        let initialUsd = (eff <= 2025) 
          ? (c.usd[eff] || 1)
          : (c.usd[2025] || 1) * Math.pow(1 + this.futureRates.CR, eff - 2025)
        
        const initialFx = FX[eff] || FX[2025] || 5.0
        let coins = (P / initialFx) / initialUsd
        let prev = P
        
        return allYrs.map((y, i) => {
          if (i === 0) return Math.round(P)
          if (y < eff) return null
          
          const currentFx = FX[y] || FX[2025] || 5.0
          const currentUsd = (y <= 2025)
            ? (c.usd[y] || 1)
            : (c.usd[2025] || 1) * Math.pow(1 + this.futureRates.CR, y - 2025)

          if (contrib > 0) {
            coins += ((contrib / 12) / currentFx) / currentUsd
            prev += (contrib / 12)
          }
          
          const value = coins * currentUsd * currentFx
          if (!this.cryptoTax) {
            prev = value
            return Math.round(value)
          }
          const gain = value - prev
          const taxed = gain > 0 ? prev + gain * (1 - 0.15) : value
          prev = taxed
          coins = taxed / (currentUsd * currentFx) 
          return Math.round(taxed)
        })
      }

      const calcCM = (k, P, contrib) => {
        const c = COMM[k]
        const eff = start
        
        const initialUsd = (eff <= 2025)
          ? (c.usd[eff] || 1)
          : (c.usd[2025] || 1) * Math.pow(1 + this.futureRates.CM, eff - 2025)
        
        const initialFx = FX[eff] || FX[2025] || 5.0
        let units = (P / initialFx) / initialUsd
        
        return allYrs.map((y, i) => {
          if (i === 0) return Math.round(P)
          if (y < eff) return null
          
          const currUsd = (y <= 2025)
            ? (c.usd[y] || 1)
            : (c.usd[2025] || 1) * Math.pow(1 + this.futureRates.CM, y - 2025)
          const currFx = FX[y] || FX[2025] || 5.0
          
          if (contrib > 0) {
            units += ((contrib / 12) / currFx) / currUsd
          }
          return Math.round(units * currUsd * currFx)
        })
      }

      // Cálculo Especial para Modo Básico com Taxa Manual
      if (this.uiMode === 'basic' && this.basicSimulationMode === 'manual') {
        let v = this.principal
        const annualContribTotal = this.monthlyEnabled ? this.monthlyValue * 12 : 0
        const data = allYrs.map((y, i) => {
          if (i === 0) return Math.round(v)
          v = v * (1 + this.manualRate) + annualContribTotal
          return Math.round(v)
        })
        this.results = [{ 
          id: 'manual', 
          isBenchmark: false, 
          type: 'RF', 
          name: 'Simulação Manual', 
          color: '#3b82f6', 
          data, 
          scenarios: this.showScenarios ? this.genScenarios(data, 'RF') : null 
        }]
        this.years = allYrs
        return
      }

      // Adicionar resultados para cada ativo selecionado
      this.selectedStocks.forEach(k => {
        if (this.uiMode === 'basic' && this.basicSimulationMode === 'manual') return
        
        const data = calcRV(k, principalPerAsset, annualContribPerAsset)
        const scenarios = this.showScenarios ? this.genScenarios(data, 'RV') : null
        assets.push({ id: k, isBenchmark: false, type: 'RV', name: STOCKS[k].short, color: STOCKS[k].color, data, scenarios })
      })
      this.selectedRF.forEach(k => {
        const data = calcRF(k, principalPerAsset, annualContribPerAsset)
        const scenarios = this.showScenarios ? this.genScenarios(data, 'RF') : null
        assets.push({ id: k, isBenchmark: false, type: 'RF', name: RF[k].short, color: RF[k].color, data, scenarios })
      })
      this.selectedCrypto.forEach(k => {
        if (this.uiMode === 'basic' && this.basicSimulationMode === 'manual') return
        const data = calcCR(k, principalPerAsset, annualContribPerAsset)
        const scenarios = this.showScenarios ? this.genScenarios(data, 'CR') : null
        assets.push({ id: k, isBenchmark: false, type: 'CR', name: CRYPTO[k].short, color: CRYPTO[k].color, data, scenarios })
      })
      this.selectedComm.forEach(k => {
        if (this.uiMode === 'basic' && this.basicSimulationMode === 'manual') return
        const data = calcCM(k, principalPerAsset, annualContribPerAsset)
        const scenarios = this.showScenarios ? this.genScenarios(data, 'CM') : null
        assets.push({ id: k, isBenchmark: false, type: 'CM', name: COMM[k].short, color: COMM[k].color, data, scenarios })
      })

      // Cálculo do Benchmark (Usa o Capital TOTAL para comparação real)
      if (this.showIBOV) {
        let v = this.principal
        const annualContribTotal = this.monthlyEnabled ? this.monthlyValue * 12 : 0
        const data = allYrs.map((y, i) => {
          if (i === 0) return Math.round(v)
          let r = 0
          if (y <= 2025) {
            r = (IBOV.p[y] / IBOV.p[allYrs[i - 1]]) - 1
          } else {
            r = this.futureRates.RV
          }
          v = v * (1 + r) + annualContribTotal
          return Math.round(v)
        })
        assets.push({ id: 'IBOV', isBenchmark: true, type: 'RV', name: 'IBOV', color: IBOV.color, data })
      }

      // Ajuste real (inflação)
      if (this.realAdjusted) {
        assets.forEach(asset => {
          asset.data = asset.data.map((v, i) => v === null ? null : Math.round(v * this.inflFactor(allYrs[i])))
        })
      }

      this.results = assets
      this.years = allYrs
    },

    genScenarios(data, type) {
      const idx2025 = this.data.YEARS.length - 1 // Assume data.YEARS termina em 2025
      const volatility = { RV: 0.05, RF: 0.015, CR: 0.15, CM: 0.08 }
      const vol = volatility[type] || 0.02
      
      const upper = []
      const lower = []
      
      data.forEach((val, i) => {
        if (i <= idx2025 || val === null) {
          upper.push(val)
          lower.push(val)
        } else {
          const yearsOut = i - idx2025
          // Expansão da incerteza com o tempo (raiz quadrada do tempo para simular passeio aleatório simples)
          const factor = vol * Math.sqrt(yearsOut)
          upper.push(Math.round(val * (1 + factor)))
          lower.push(Math.round(val * (1 - factor)))
        }
      })
      return { upper, lower }
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light')
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }
})
