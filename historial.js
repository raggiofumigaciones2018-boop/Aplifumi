/* ============================================
   APLIFUMI — Módulo Historial
   Últimos movimientos con filtros y búsqueda
   ============================================ */

/**
 * Vista de Historial de movimientos.
 * Muestra los últimos 10 registros con filtros, badges y exportación.
 */
const Historial = (() => {
  'use strict';

  /** Categorías de gastos para el filtro */
  const CATEGORIAS = [
    'Insumos', 'Materiales', 'Combustible', 'Movilidad',
    'Servicios', 'Impuestos', 'Herramientas', 'Otros',
  ];

  /** Columnas para exportación */
  const EXPORT_COLUMNS = [
    { key: 'fecha',       label: 'Fecha' },
    { key: 'tipo',        label: 'Tipo' },
    { key: 'nombre',      label: 'Cliente / Proveedor' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'importe',     label: 'Importe' },
  ];

  /** Datos del historial actual (para exportar) */
  let _currentData = [];

  /* ─── Renderizado ─── */

  /** Genera el HTML completo de la vista Historial */
  function render() {
    return `
      <section id="historial-view" class="space-y-4 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header">
          <h1 class="section-title">
            <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Historial
          </h1>
          <!-- Botón exportar -->
          <div class="flex gap-2">
            <button id="btn-export-csv" class="btn-secondary text-xs px-3 py-2" title="Exportar CSV">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              CSV
            </button>
            <button id="btn-export-excel" class="btn-secondary text-xs px-3 py-2" title="Exportar Excel">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Excel
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="glass-card p-4 space-y-3">
          <div class="flex items-center justify-between cursor-pointer" id="toggle-filtros">
            <span class="text-sm font-semibold" style="color: var(--text-secondary)">
              <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filtros
            </span>
            <svg id="chevron-filtros" class="w-4 h-4 transition-transform" style="color: var(--text-tertiary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>

          <div id="filtros-container" class="space-y-3 hidden">
            <!-- Búsqueda -->
            <div>
              <input type="text" id="filtro-busqueda" class="form-input" placeholder="🔍 Buscar por cliente o proveedor..." autocomplete="off">
            </div>

            <!-- Tipo -->
            <div class="flex gap-2">
              <button class="filtro-tipo flex-1 btn-secondary text-xs py-2" data-tipo="">Todos</button>
              <button class="filtro-tipo flex-1 btn-secondary text-xs py-2" data-tipo="ingreso">🟢 Ingresos</button>
              <button class="filtro-tipo flex-1 btn-secondary text-xs py-2" data-tipo="gasto">🔴 Gastos</button>
            </div>

            <!-- Fechas -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="filtro-fecha-desde" class="form-label">Desde</label>
                <input type="date" id="filtro-fecha-desde" class="form-input text-sm">
              </div>
              <div>
                <label for="filtro-fecha-hasta" class="form-label">Hasta</label>
                <input type="date" id="filtro-fecha-hasta" class="form-input text-sm">
              </div>
            </div>

            <!-- Categoría -->
            <div>
              <label for="filtro-categoria" class="form-label">Categoría (Gastos)</label>
              <select id="filtro-categoria" class="form-input text-sm">
                <option value="">Todas las categorías</option>
                ${CATEGORIAS.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>

            <!-- Botón aplicar -->
            <button id="btn-aplicar-filtros" class="btn-secondary w-full text-sm">
              Aplicar Filtros
            </button>
          </div>
        </div>

        <!-- Lista de movimientos -->
        <div id="historial-lista" class="space-y-3">
          ${Render.skeletonRows(5)}
        </div>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  /** Inicializa eventos y carga datos */
  async function init() {
    _bindEvents();
    await _loadData();
  }

  /** Vincula todos los event listeners */
  function _bindEvents() {
    // Toggle filtros
    const toggleFiltros = document.getElementById('toggle-filtros');
    if (toggleFiltros) {
      toggleFiltros.addEventListener('click', _toggleFilters);
    }

    // Botones de tipo
    document.querySelectorAll('.filtro-tipo').forEach(btn => {
      btn.addEventListener('click', _handleTipoFilter);
    });

    // Aplicar filtros
    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    if (btnAplicar) {
      btnAplicar.addEventListener('click', _loadData);
    }

    // Exportar
    const btnCSV = document.getElementById('btn-export-csv');
    if (btnCSV) {
      btnCSV.addEventListener('click', () => _exportData('csv'));
    }

    const btnExcel = document.getElementById('btn-export-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => _exportData('excel'));
    }

    // Búsqueda con debounce
    const inputBusqueda = document.getElementById('filtro-busqueda');
    if (inputBusqueda) {
      let debounceTimer;
      inputBusqueda.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(_loadData, 500);
      });
    }
  }

  /** Muestra/oculta el panel de filtros */
  function _toggleFilters() {
    const container = document.getElementById('filtros-container');
    const chevron = document.getElementById('chevron-filtros');
    if (!container) return;

    const isHidden = container.classList.contains('hidden');
    container.classList.toggle('hidden');

    if (chevron) {
      chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    if (isHidden) {
      container.classList.add('animate-fade-in-up');
      setTimeout(() => container.classList.remove('animate-fade-in-up'), 400);
    }
  }

  /** Maneja la selección de filtro por tipo */
  function _handleTipoFilter(event) {
    document.querySelectorAll('.filtro-tipo').forEach(btn => {
      btn.style.borderColor = '';
      btn.style.color = '';
    });

    const btn = event.currentTarget;
    btn.style.borderColor = 'var(--color-accent)';
    btn.style.color = 'var(--color-accent)';
    btn.dataset.selected = 'true';

    // Marcar el tipo seleccionado
    document.querySelectorAll('.filtro-tipo').forEach(b => {
      if (b !== btn) delete b.dataset.selected;
    });
  }

  /** Obtiene los filtros actuales del formulario */
  function _getFilters() {
    const filters = {};

    const busqueda = document.getElementById('filtro-busqueda');
    if (busqueda && busqueda.value.trim()) {
      filters.busqueda = busqueda.value.trim();
    }

    const tipoBtn = document.querySelector('.filtro-tipo[data-selected]');
    if (tipoBtn && tipoBtn.dataset.tipo) {
      filters.tipo = tipoBtn.dataset.tipo;
    }

    const fechaDesde = document.getElementById('filtro-fecha-desde');
    if (fechaDesde && fechaDesde.value) {
      filters.fechaDesde = fechaDesde.value;
    }

    const fechaHasta = document.getElementById('filtro-fecha-hasta');
    if (fechaHasta && fechaHasta.value) {
      filters.fechaHasta = fechaHasta.value;
    }

    const categoria = document.getElementById('filtro-categoria');
    if (categoria && categoria.value) {
      filters.categoria = categoria.value;
    }

    return filters;
  }

  /* ─── Carga de Datos ─── */

  /** Carga datos del historial desde la API */
  async function _loadData() {
    const lista = document.getElementById('historial-lista');
    if (!lista) return;

    lista.innerHTML = Render.skeletonRows(5);

    try {
      const filters = _getFilters();
      const response = await Api.getHistorial(filters);

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener historial');
      }

      _currentData = _normalizeData(response.data || []);
      _renderList(_currentData);

    } catch (error) {
      lista.innerHTML = Render.errorState(error.message, 'Historial.reload');
    }
  }

  /**
   * Normaliza datos del backend para renderizado uniforme.
   * Los datos de ingresos y gastos tienen campos diferentes;
   * esta función los unifica para la vista.
   */
  function _normalizeData(items) {
    return items.map(item => ({
      ...item,
      nombre: item.tipo === 'ingreso' ? (item.cliente || '—') : (item.proveedor || '—'),
      descripcion: item.tipo === 'ingreso' ? (item.servicio || item['servicioPrestado'] || '—') : (item.detalle || item['detalleGasto'] || '—'),
      importe: Number(item.importe) || 0,
    }));
  }

  /** Renderiza la lista de movimientos */
  function _renderList(items) {
    const lista = document.getElementById('historial-lista');
    if (!lista) return;

    if (items.length === 0) {
      lista.innerHTML = Render.emptyState(
        '📋',
        'Sin movimientos',
        'Los registros aparecerán aquí después de guardar ingresos o gastos.'
      );
      return;
    }

    lista.innerHTML = items.map((item, index) => _renderMovimiento(item, index)).join('');
  }

  /**
   * Renderiza una card de movimiento individual.
   * @param {Object} item — Datos del movimiento.
   * @param {number} index — Índice para animación escalonada.
   * @returns {string} HTML de la card.
   */
  function _renderMovimiento(item, index) {
    const isIngreso = item.tipo === 'ingreso';
    const badgeClass = isIngreso ? 'badge-income' : 'badge-expense';
    const badgeText = isIngreso ? '🟢 Ingreso' : '🔴 Gasto';
    const importeColor = isIngreso ? 'var(--color-income)' : 'var(--color-expense)';
    const importePrefix = isIngreso ? '+' : '-';
    const delay = Math.min(index, 4);

    return `
      <div class="glass-card p-4 animate-fade-in-up stagger-${delay + 1}">
        <div class="flex items-start gap-3">
          <!-- Ícono tipo -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIngreso ? 'gradient-income' : 'gradient-expense'}">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              ${isIngreso
                ? '<path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7"/>'
                : '<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7"/>'
              }
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="badge ${badgeClass}">${badgeText}</span>
              <span class="text-xs" style="color: var(--text-tertiary)">${Render.formatDate(item.fecha)}</span>
            </div>
            <p class="text-sm font-semibold truncate" style="color: var(--text-primary)">${_escapeHtml(item.nombre)}</p>
            <p class="text-xs truncate mt-0.5" style="color: var(--text-secondary)">${_escapeHtml(item.descripcion)}</p>
          </div>

          <!-- Importe -->
          <div class="text-right flex-shrink-0">
            <p class="text-sm font-bold" style="color: ${importeColor}">
              ${importePrefix}${Render.formatCurrency(item.importe)}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /* ─── Exportación ─── */

  /** Exporta los datos actuales en el formato especificado */
  function _exportData(format) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `historial_${timestamp}`;

    // Preparar datos para exportación
    const exportData = _currentData.map(item => ({
      fecha: item.fecha || '',
      tipo: item.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      importe: item.importe || 0,
    }));

    if (format === 'csv') {
      Exportar.toCSV(exportData, EXPORT_COLUMNS, filename);
    } else {
      Exportar.toExcel(exportData, EXPORT_COLUMNS, filename);
    }
  }

  /* ─── Utilidades ─── */

  /** Escapa HTML para prevenir XSS */
  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Recarga los datos (llamada desde botón de reintentar) */
  async function reload() {
    await _loadData();
  }

  /** Limpieza al salir de la vista */
  function destroy() {
    _currentData = [];
  }

  // Exponer reload como global para el botón de reintentar
  window.Historial = { render, init, destroy, reload };

  return { render, init, destroy, reload };
})();
