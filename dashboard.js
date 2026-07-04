/* ============================================
   APLIFUMI — Módulo Dashboard
   Tarjetas de resumen: Saldo, Ingresos, Gastos
   ============================================ */

/**
 * Vista principal del Dashboard.
 * Muestra las 3 tarjetas resumen con datos financieros en tiempo real.
 * UI "tonta" — solo presenta datos recibidos de la API.
 */
const Dashboard = (() => {
  'use strict';

  /* ─── Renderizado ─── */

  function render() {
    return `
      <section id="dashboard-view" class="space-y-4 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 class="section-title">
            <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Inicio
          </h1>

          <!-- Filtros de Fecha y Acciones Rápidas -->
          <div class="flex items-center gap-3">
            <!-- Acciones Rápidas Mini -->
            <div class="flex items-center gap-1.5 border-r pr-3" style="border-color: var(--surface-border)">
              <button onclick="App.navigate('clientes')" title="Clientes" class="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style="background: rgba(139, 92, 246, 0.15)">
                <svg class="w-4.5 h-4.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </button>
              <button onclick="App.navigate('proveedores')" title="Proveedores" class="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style="background: rgba(236, 72, 153, 0.15)">
                <svg class="w-4.5 h-4.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </button>
              <button onclick="App.navigate('ingresos')" title="Nuevo Ingreso" class="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style="background: rgba(var(--color-income-rgb), 0.15)">
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="color: var(--color-income)">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              <button onclick="App.navigate('gastos')" title="Nuevo Gasto" class="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style="background: rgba(var(--color-expense-rgb), 0.15)">
                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="color: var(--color-expense)">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/>
                </svg>
              </button>
            </div>

            <!-- Filtros de Fecha -->
            <div class="flex items-center gap-2">
              <select id="dashboard-filtro-mes" class="form-input text-xs py-1.5 px-2 rounded-xl" style="background: var(--surface-secondary); border-color: var(--surface-border); height: 2.25rem; width: 9.5rem;">
                <option value="">Todos los Meses</option>
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
              <select id="dashboard-filtro-anio" class="form-input text-xs py-1.5 px-2 rounded-xl" style="background: var(--surface-secondary); border-color: var(--surface-border); height: 2.25rem; width: 7.5rem;">
                <option value="">Todos los Años</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026" selected>2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Banner modo demo -->
        <div id="dashboard-demo-banner"></div>

        <!-- Cards de resumen -->
        <div id="dashboard-cards" class="space-y-4">
          ${_renderSkeletons()}
        </div>
      </section>
    `;
  }

  /** Renderiza skeletons de carga para las cards */
  function _renderSkeletons() {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="summary-card gradient-balance animate-pulse" style="min-height: 5.5rem;">
          <div class="h-3 w-16 bg-white/20 rounded mb-2"></div>
          <div class="h-6 w-24 bg-white/20 rounded"></div>
        </div>
        <div class="summary-card gradient-accent animate-pulse" style="min-height: 5.5rem;">
          <div class="h-3 w-16 bg-white/20 rounded mb-2"></div>
          <div class="h-6 w-24 bg-white/20 rounded"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="summary-card gradient-income animate-pulse" style="min-height: 5.5rem;">
          <div class="h-3 w-16 bg-white/20 rounded mb-2"></div>
          <div class="h-6 w-24 bg-white/20 rounded"></div>
        </div>
        <div class="summary-card gradient-expense animate-pulse" style="min-height: 5.5rem;">
          <div class="h-3 w-16 bg-white/20 rounded mb-2"></div>
          <div class="h-6 w-24 bg-white/20 rounded"></div>
        </div>
      </div>
    `;
  }

  /** Renderiza las cards de resumen con datos reales */
  function _renderCards(data) {
    const { saldoNeto, resultadoNeto, totalIngresos, totalGastos } = data;

    return `
      <!-- Primera Fila: Saldo de Caja y Resultado Neto -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Saldo de Caja (Cobrado - Abonado) -->
        <div class="summary-card gradient-balance animate-fade-in-up stagger-1">
          <div class="card-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
            </svg>
          </div>
          <p class="text-white/70 text-xs font-medium mb-1">Saldo de Caja</p>
          <p class="text-lg font-bold text-white tracking-tight">${Render.formatCurrency(saldoNeto)}</p>
          <p class="text-white/50 text-[10px] mt-0.5">Cobrado − Abonado</p>
        </div>

        <!-- Resultado Neto (Ingresos - Egresos Totales) -->
        <div class="summary-card gradient-accent animate-fade-in-up stagger-2">
          <div class="card-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <p class="text-white/70 text-xs font-medium mb-1">Resultado Neto</p>
          <p class="text-lg font-bold text-white tracking-tight">${Render.formatCurrency(resultadoNeto)}</p>
          <p class="text-white/50 text-[10px] mt-0.5">Ingresos − Egresos</p>
        </div>
      </div>

      <!-- Segunda Fila: Ingresos y Gastos Totales -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Ingresos -->
        <div class="summary-card gradient-income animate-fade-in-up stagger-3">
          <div class="card-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
            </svg>
          </div>
          <p class="text-white/70 text-xs font-medium mb-1">Facturación Total</p>
          <p class="text-lg font-bold text-white">${Render.formatCurrency(totalIngresos)}</p>
          <p class="text-white/50 text-[10px] mt-0.5">Pendiente + Cobrado</p>
        </div>

        <!-- Gastos -->
        <div class="summary-card gradient-expense animate-fade-in-up stagger-4">
          <div class="card-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181"/>
            </svg>
          </div>
          <p class="text-white/70 text-xs font-medium mb-1">Egresos Totales</p>
          <p class="text-lg font-bold text-white">${Render.formatCurrency(totalGastos)}</p>
          <p class="text-white/50 text-[10px] mt-0.5">Pendiente + Abonado</p>
        </div>
      </div>

      <!-- Métricas Avanzadas Adicionales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Cantidad de servicios por localidad y total -->
        <div class="glass-card gradient-locs animate-fade-in-up p-4 space-y-3" style="border: 1px solid rgba(255,255,255,0.08)">
          <div class="flex items-center justify-between border-b pb-2" style="border-color: rgba(255,255,255,0.15)">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <h3 class="text-xs font-bold uppercase tracking-wider text-white/90">
                Servicios por Localidad
              </h3>
            </div>
            <span class="px-2 py-0.5 text-[9px] font-bold rounded-full bg-white/20 text-white">
              Total: ${data.cantidadServiciosTotal || 0}
            </span>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${Object.keys(data.serviciosPorLocalidad || {}).length === 0 
              ? `<p class="text-xs text-center py-6 text-white/70">Sin servicios en este período</p>`
              : Object.entries(data.serviciosPorLocalidad || {})
                  .sort((a,b) => b[1] - a[1])
                  .map(([loc, count]) => `
                    <div class="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-white/10">
                      <span class="font-medium text-white/90">${loc}</span>
                      <span class="font-semibold px-2 py-0.5 rounded-lg text-[9px] bg-white/15 text-white">${count} serv.</span>
                    </div>
                  `).join('')
            }
          </div>
        </div>

        <!-- Ingresos por Localidad -->
        <div class="glass-card gradient-revs animate-fade-in-up p-4 space-y-3" style="border: 1px solid rgba(255,255,255,0.08)">
          <div class="flex items-center gap-2 border-b pb-2" style="border-color: rgba(255,255,255,0.15)">
            <svg class="w-4 h-4 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5"/>
            </svg>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/90">
              Ingresos por Localidad
            </h3>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${Object.keys(data.ingresosPorLocalidad || {}).length === 0 
              ? `<p class="text-xs text-center py-6 text-white/70">Sin cobros en este período</p>`
              : Object.entries(data.ingresosPorLocalidad || {})
                  .sort((a,b) => b[1] - a[1])
                  .map(([loc, total]) => `
                    <div class="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-white/10">
                      <span class="font-medium text-white/90">${loc}</span>
                      <span class="font-bold text-white">${Render.formatCurrency(total)}</span>
                    </div>
                  `).join('')
            }
          </div>
        </div>

        <!-- Ingresos por Tipo de Servicio -->
        <div class="glass-card gradient-services animate-fade-in-up p-4 md:col-span-1 space-y-3" style="border: 1px solid rgba(255,255,255,0.08)">
          <div class="flex items-center gap-2 border-b pb-2" style="border-color: rgba(255,255,255,0.15)">
            <svg class="w-4 h-4 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/90">
              Ingresos por Tipo de Servicio
            </h3>
          </div>
          
          <div id="service-revenues-list" class="space-y-2">
            ${(() => {
              const services = Object.entries(data.ingresosPorServicio || {}).sort((a,b) => b[1] - a[1]);
              if (services.length === 0) {
                return `<p class="text-xs text-center py-6 text-white/70">Sin servicios cargados en este período</p>`;
              }
              
              return services.map(([serv, total], index) => {
                const hiddenClass = index >= 5 ? 'hidden extra-service-item' : '';
                return `
                  <div class="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-white/10 ${hiddenClass}">
                    <span class="font-medium text-white/95">${serv}</span>
                    <span class="font-bold text-white">${Render.formatCurrency(total)}</span>
                  </div>
                `;
              }).join('');
            })()}
          </div>

          ${(() => {
            const count = Object.keys(data.ingresosPorServicio || {}).length;
            if (count > 5) {
              return `
                <div class="flex justify-center pt-1.5">
                  <button id="btn-toggle-services" onclick="Dashboard.toggleExtraServices(this)" class="text-[11px] font-semibold px-3.5 py-1 rounded-xl transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5 bg-white/20 text-white hover:bg-white/30 border border-white/10">
                    <span>Mostrar más</span>
                    <svg class="w-3 h-3 transform transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              `;
            }
            return '';
          })()}
        </div>

        <!-- Gastos por Categoría -->
        <div class="glass-card gradient-categories animate-fade-in-up p-4 md:col-span-1 space-y-3" style="border: 1px solid rgba(255,255,255,0.08)">
          <div class="flex items-center gap-2 border-b pb-2" style="border-color: rgba(255,255,255,0.15)">
            <svg class="w-4 h-4 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white/90">
              Gastos por Categoría
            </h3>
          </div>
          
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${Object.keys(data.gastosPorCategoria || {}).length === 0 
              ? `<p class="text-xs text-center py-6 text-white/70">Sin gastos en este período</p>`
              : Object.entries(data.gastosPorCategoria || {})
                  .sort((a,b) => b[1] - a[1])
                  .map(([cat, total]) => `
                    <div class="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-white/10">
                      <span class="font-medium text-white/95">${cat}</span>
                      <span class="font-bold text-white">${Render.formatCurrency(total)}</span>
                    </div>
                  `).join('')
            }
          </div>
        </div>

      </div>
    `;
  }

  /* ─── Inicialización ─── */

  /** Inicializa la vista: carga datos desde la API */
  async function init() {
    // Mostrar banner de demo si el backend no está configurado
    _showDemoBanner();

    // Vincular selectores de fecha
    const selMes = document.getElementById('dashboard-filtro-mes');
    const selAnio = document.getElementById('dashboard-filtro-anio');

    if (selMes && !selMes.dataset.listenerBound) {
      selMes.addEventListener('change', () => _fetchAndRenderFiltered());
      selMes.dataset.listenerBound = 'true';
    }
    if (selAnio && !selAnio.dataset.listenerBound) {
      selAnio.addEventListener('change', () => _fetchAndRenderFiltered());
      selAnio.dataset.listenerBound = 'true';
    }

    await _fetchAndRenderFiltered();
  }

  /** Carga la información filtrada y actualiza las cards en pantalla */
  async function _fetchAndRenderFiltered() {
    const cardsContainer = document.getElementById('dashboard-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = _renderSkeletons();
    }

    try {
      const selMes = document.getElementById('dashboard-filtro-mes');
      const selAnio = document.getElementById('dashboard-filtro-anio');
      const mes = selMes ? selMes.value : '';
      const anio = selAnio ? selAnio.value : '';

      const response = await Api.getDashboard({ mes, anio });

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener datos');
      }

      if (cardsContainer) {
        cardsContainer.innerHTML = _renderCards(response.data);
      }

    } catch (error) {
      if (cardsContainer) {
        cardsContainer.innerHTML = Render.errorState(error.message, 'Dashboard.reload');
      }
    }
  }

  /** Muestra un banner si el backend no está configurado */
  function _showDemoBanner() {
    if (Api.isConfigured()) return;

    const banner = document.getElementById('dashboard-demo-banner');
    if (!banner) return;

    banner.innerHTML = `
      <div class="glass-card p-4 flex items-start gap-3 animate-fade-in" style="border-left: 3px solid var(--color-accent)">
        <span class="text-xl flex-shrink-0">🧪</span>
        <div>
          <p class="text-sm font-semibold" style="color: var(--text-primary)">Modo Demo</p>
          <p class="text-xs mt-0.5" style="color: var(--text-secondary)">
            Los datos se almacenan en memoria. Configurá la URL del backend en <code class="px-1 py-0.5 rounded text-xs" style="background: var(--surface-border)">api.js</code> para conectar con Google Sheets.
          </p>
        </div>
      </div>
    `;
  }

  /** Recarga los datos del dashboard (llamada desde botón de reintentar) */
  async function reload() {
    const cardsContainer = document.getElementById('dashboard-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = _renderSkeletons();
    }
    await init();
  }

  /** Limpieza al salir de la vista */
  function destroy() {
    // Sin recursos que limpiar en esta vista
  }

  /** Alterna la visibilidad de los servicios extras después del quinto */
  function toggleExtraServices(btn) {
    if (!btn) return;
    const items = document.querySelectorAll('.extra-service-item');
    const isExpanding = btn.querySelector('span').textContent === 'Mostrar más';
    
    items.forEach(el => {
      if (isExpanding) {
        el.classList.remove('hidden');
        el.classList.add('animate-fade-in');
      } else {
        el.classList.add('hidden');
      }
    });

    btn.querySelector('span').textContent = isExpanding ? 'Mostrar menos' : 'Mostrar más';
    const svg = btn.querySelector('svg');
    if (svg) {
      if (isExpanding) {
        svg.classList.add('rotate-180');
      } else {
        svg.classList.remove('rotate-180');
      }
    }
  }

  // Exponer reload y helpers como globales para el botón de reintentar y eventos
  window.Dashboard = { render, init, destroy, reload, toggleExtraServices };

  return { render, init, destroy, reload, toggleExtraServices };
})();
