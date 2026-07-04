/* ============================================
   APLIFUMI — Módulo Estadísticas
   Gráficos interactivos con Chart.js
   ============================================ */

/**
 * Vista de Estadísticas con gráficos.
 * Gráfico de barras: Ingresos vs Gastos por mes.
 * Gráfico de torta: Distribución de gastos por categoría.
 */
const Estadisticas = (() => {
  'use strict';

  /** Referencias a las instancias de Chart.js (para destruir al cambiar de vista) */
  let _barChart = null;
  let _pieChart = null;

  /* ─── Renderizado ─── */

  /** Genera el HTML completo de la vista Estadísticas */
  function render() {
    return `
      <section id="estadisticas-view" class="space-y-5 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header">
          <h1 class="section-title">
            <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
            </svg>
            Estadísticas
          </h1>
        </div>

        <!-- Gráfico de Barras -->
        <div class="glass-card p-5">
          <h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--text-secondary)">
            Ingresos vs Gastos por Mes
          </h2>
          <div id="bar-chart-container" class="relative" style="min-height: 250px;">
            <canvas id="bar-chart"></canvas>
            <div id="bar-chart-loading" class="absolute inset-0 flex items-center justify-center">
              <div class="skeleton w-full h-full rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Gráfico de Torta -->
        <div class="glass-card p-5">
          <h2 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: var(--text-secondary)">
            Gastos por Categoría
          </h2>
          <div id="pie-chart-container" class="relative flex justify-center" style="min-height: 250px;">
            <canvas id="pie-chart" style="max-width: 300px;"></canvas>
            <div id="pie-chart-loading" class="absolute inset-0 flex items-center justify-center">
              <div class="skeleton w-full h-full rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Botón imprimir -->
        <button onclick="window.print()" class="btn-secondary w-full">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Imprimir Reporte
        </button>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  /** Inicializa los gráficos con datos de la API */
  async function init() {
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
      const container = document.getElementById('estadisticas-view');
      if (container) {
        container.innerHTML = Render.errorState('Chart.js no está disponible. Verificá tu conexión a internet.');
      }
      return;
    }

    _configureChartDefaults();
    await _loadData();
  }

  /** Configura los defaults de Chart.js para el tema actual */
  function _configureChartDefaults() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.06)';

    Chart.defaults.color = textColor;
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.scale = Chart.defaults.scale || {};
  }

  /** Carga datos estadísticos desde la API */
  async function _loadData() {
    try {
      const response = await Api.getEstadisticas();

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener estadísticas');
      }

      const data = response.data;
      _renderBarChart(data.ingresosPorMes || [], data.gastosPorMes || []);
      _renderPieChart(data.gastosPorCategoria || []);

    } catch (error) {
      // Si no hay datos, mostrar gráficos vacíos con mensaje
      _renderBarChart([], []);
      _renderPieChart([]);
    }
  }

  /* ─── Gráficos ─── */

  /**
   * Renderiza el gráfico de barras (Ingresos vs Gastos por mes).
   * @param {Array<{mes: string, total: number}>} ingresos — Datos de ingresos por mes.
   * @param {Array<{mes: string, total: number}>} gastos — Datos de gastos por mes.
   */
  function _renderBarChart(ingresos, gastos) {
    // Ocultar loading
    const loading = document.getElementById('bar-chart-loading');
    if (loading) loading.style.display = 'none';

    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;

    // Destruir gráfico anterior si existe
    if (_barChart) {
      _barChart.destroy();
      _barChart = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Generar labels de los últimos 6 meses si no hay datos
    const labels = _getLastMonthsLabels(6);
    const ingresosData = _mapDataToLabels(ingresos, labels);
    const gastosData = _mapDataToLabels(gastos, labels);

    _barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.map(_formatMonthLabel),
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Gastos',
            data: gastosData,
            backgroundColor: 'rgba(244, 63, 94, 0.7)',
            borderColor: '#f43f5e',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#f1f5f9' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? 'rgba(148,163,184,0.2)' : '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Render.formatCurrency(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.04)' },
            ticks: {
              callback: (value) => Render.formatCurrency(value),
            },
          },
        },
      },
    });
  }

  /**
   * Renderiza el gráfico de torta (Gastos por categoría).
   * @param {Array<{categoria: string, total: number}>} datos — Datos por categoría.
   */
  function _renderPieChart(datos) {
    const loading = document.getElementById('pie-chart-loading');
    if (loading) loading.style.display = 'none';

    const canvas = document.getElementById('pie-chart');
    if (!canvas) return;

    if (_pieChart) {
      _pieChart.destroy();
      _pieChart = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Colores para las categorías
    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
      '#f43f5e', '#06b6d4', '#ec4899', '#6366f1',
    ];

    const labels = datos.length > 0 ? datos.map(d => d.categoria) : ['Sin datos'];
    const values = datos.length > 0 ? datos.map(d => d.total) : [1];
    const bgColors = datos.length > 0
      ? datos.map((_, i) => colors[i % colors.length])
      : ['rgba(148, 163, 184, 0.3)'];

    _pieChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderColor: isDark ? '#0f172a' : '#fff',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#f1f5f9' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#64748b',
            borderColor: isDark ? 'rgba(148,163,184,0.2)' : '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.label}: ${Render.formatCurrency(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  /* ─── Utilidades de Fechas ─── */

  /**
   * Genera labels de los últimos N meses en formato YYYY-MM.
   * @param {number} count — Cantidad de meses.
   * @returns {string[]} Array de strings 'YYYY-MM'.
   */
  function _getLastMonthsLabels(count) {
    const labels = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      labels.push(`${d.getFullYear()}-${month}`);
    }
    return labels;
  }

  /**
   * Mapea datos del backend a los labels de meses.
   * @param {Array<{mes: string, total: number}>} data — Datos por mes.
   * @param {string[]} labels — Labels de meses esperados.
   * @returns {number[]} Valores mapeados (0 si no hay dato).
   */
  function _mapDataToLabels(data, labels) {
    const dataMap = {};
    for (const item of data) {
      dataMap[item.mes] = item.total;
    }
    return labels.map(label => dataMap[label] || 0);
  }

  /**
   * Formatea un label de mes 'YYYY-MM' a nombre legible.
   * @param {string} label — Label en formato 'YYYY-MM'.
   * @returns {string} Nombre del mes abreviado.
   */
  function _formatMonthLabel(label) {
    const [year, month] = label.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[Number(month) - 1]} ${year.slice(2)}`;
  }

  /** Limpieza al salir de la vista — destruir instancias de Chart.js */
  function destroy() {
    if (_barChart) {
      _barChart.destroy();
      _barChart = null;
    }
    if (_pieChart) {
      _pieChart.destroy();
      _pieChart = null;
    }
  }

  return { render, init, destroy };
})();
