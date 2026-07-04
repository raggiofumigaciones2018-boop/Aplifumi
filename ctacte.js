/* ============================================
   APLIFUMI — Módulo de Cuenta Corriente
   Vista para gestionar saldos pendientes de cobro de clientes
   ============================================ */

/**
 * Módulo de Cuenta Corriente (CtaCte).
 * Permite filtrar ingresos no abonados y cobrarlos directamente.
 */
const CtaCte = (() => {
  'use strict';

  let _movimientos = [];
  let _activeTab = 'clientes'; // 'clientes' o 'proveedores'

  /* ─── Renderizado ─── */

  function render() {
    return `
      <section id="ctacte-view" class="space-y-5 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header flex justify-between items-center">
          <div>
            <h1 class="section-title">
              <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Cuenta Corriente
            </h1>
            <p class="text-xs text-slate-400">Controla saldos pendientes de cobro a clientes o de pago a proveedores.</p>
          </div>
          <button id="btn-refresh-ctacte" class="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-[var(--surface-secondary)] text-[var(--text-secondary)]" aria-label="Actualizar">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"/>
            </svg>
          </button>
        </div>

        <!-- Selector de Pestañas (Sub-navegación) -->
        <div class="flex p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--surface-border)]">
          <button id="tab-ctacte-clientes" class="flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
            _activeTab === 'clientes' ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }">
            Saldos Clientes (Cobros)
          </button>
          <button id="tab-ctacte-proveedores" class="flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
            _activeTab === 'proveedores' ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }">
            Saldos Proveedores (Pagos)
          </button>
        </div>

        <!-- Indicador Resumen -->
        <div class="grid grid-cols-2 gap-4">
          <div class="glass-card p-4 flex flex-col justify-between" style="background: rgba(244, 63, 94, 0.08); border-color: rgba(244, 63, 94, 0.15)">
            <span id="ctacte-lbl-total" class="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              ${_activeTab === 'clientes' ? 'Pendiente de Cobro' : 'Pendiente de Pago'}
            </span>
            <span id="ctacte-total-pendiente" class="text-2xl font-extrabold text-rose-500 mt-1">$0.00</span>
          </div>
          <div class="glass-card p-4 flex flex-col justify-between" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.15)">
            <span id="ctacte-lbl-cant" class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              ${_activeTab === 'clientes' ? 'Servicios Pendientes' : 'Gastos Pendientes'}
            </span>
            <span id="ctacte-cant-pendiente" class="text-2xl font-extrabold text-emerald-500 mt-1">0</span>
          </div>
        </div>

        <!-- Listado Pendientes -->
        <div class="glass-card p-4 space-y-4">
          <h2 id="ctacte-lbl-detalle" class="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            ${_activeTab === 'clientes' ? 'Detalle de Cobros Pendientes' : 'Detalle de Pagos Pendientes'}
          </h2>
          <div id="ctacte-lista" class="space-y-3">
            <div class="text-center text-sm py-8 text-slate-500">Cargando saldos...</div>
          </div>
        </div>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  function init() {
    // Refresh handler
    const refreshBtn = document.getElementById('btn-refresh-ctacte');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', _loadCtaCte);
    }

    // Tab handlers
    const btnClientes = document.getElementById('tab-ctacte-clientes');
    const btnProveedores = document.getElementById('tab-ctacte-proveedores');

    if (btnClientes && btnProveedores) {
      btnClientes.addEventListener('click', () => {
        if (_activeTab !== 'clientes') {
          _activeTab = 'clientes';
          // Forzar refresco de la vista
          const container = document.getElementById('main-content');
          if (container) {
            container.innerHTML = render();
            init();
          }
        }
      });
      btnProveedores.addEventListener('click', () => {
        if (_activeTab !== 'proveedores') {
          _activeTab = 'proveedores';
          // Forzar refresco de la vista
          const container = document.getElementById('main-content');
          if (container) {
            container.innerHTML = render();
            init();
          }
        }
      });
    }

    // Action button handlers
    const lista = document.getElementById('ctacte-lista');
    if (lista) {
      lista.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-cobrar-action');
        if (btn) {
          const id = btn.getAttribute('data-id');
          if (id) {
            marcarComoCobrado(id);
          }
        }
      });
    }

    _loadCtaCte();
  }

  async function _loadCtaCte() {
    const lista = document.getElementById('ctacte-lista');
    const txtTotal = document.getElementById('ctacte-total-pendiente');
    const txtCant = document.getElementById('ctacte-cant-pendiente');
    if (!lista) return;

    try {
      // Obtenemos historial completo
      const response = await Api.getHistorial({ limit: 1000, tipo: _activeTab === 'clientes' ? 'ingreso' : 'gasto' });
      if (!response.success) throw new Error(response.message);

      // Filtramos únicamente los no abonados (Abonado = NO o PENDIENTE)
      _movimientos = (response.data || []).filter(m => {
        const abonado = (m.abonado || m.Abonado || '').toString().trim().toUpperCase();
        return (_activeTab === 'clientes' ? m.tipo === 'ingreso' : m.tipo === 'gasto') && 
               (abonado === 'NO' || abonado === 'PENDIENTE');
      });

      // Calcular totales
      const total = _movimientos.reduce((sum, m) => sum + parseFloat(m.importe || 0), 0);
      if (txtTotal) txtTotal.textContent = `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (txtCant) txtCant.textContent = _movimientos.length;

      if (_movimientos.length === 0) {
        lista.innerHTML = `
          <div class="text-center py-10 space-y-2">
            <span class="text-3xl">🎉</span>
            <p class="text-sm font-medium text-slate-400">
              ${_activeTab === 'clientes' ? '¡Al día! No hay cobros pendientes.' : '¡Al día! No hay pagos pendientes.'}
            </p>
          </div>
        `;
        return;
      }

      lista.innerHTML = _movimientos.map(m => `
        <div class="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700" style="background: var(--surface-secondary); border-color: var(--surface-border)">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-100">${_escapeHtml(_activeTab === 'clientes' ? m.cliente : m.proveedor)}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">PENDIENTE</span>
            </div>
            <p class="text-xs text-slate-400">${_escapeHtml(_activeTab === 'clientes' ? m.servicio : (m.detalle + ' (' + m.categoria + ')'))} — 📅 ${_formatDate(m.fecha)}</p>
          </div>

          <div class="flex items-center justify-between md:justify-end gap-5">
            <span class="text-base font-extrabold text-slate-100">$${parseFloat(m.importe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            <button data-id="${m.id}" class="btn-cobrar-action px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 active:scale-95" style="background: linear-gradient(135deg, ${_activeTab === 'clientes' ? 'var(--color-income), #059669' : 'var(--color-expense), #e11d48'})">
              ${_activeTab === 'clientes' ? 'Cobrar' : 'Pagar'}
            </button>
          </div>
        </div>
      `).join('');

    } catch (e) {
      lista.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">Error al cargar cuenta corriente: ${e.message}</div>`;
    }
  }

  /**
   * Marca un movimiento como abonado (Abonado = SI) en backend.
   */
  async function marcarComoCobrado(id) {
    const actionMsg = _activeTab === 'clientes' 
      ? '¿Confirmas que recibiste el cobro de este servicio?' 
      : '¿Confirmas que ya pagaste este gasto?';

    if (!confirm(actionMsg)) return;

    try {
      const response = await Api.updateMovimientoAbonado({ id: id, abonado: 'SI' });
      if (!response.success) throw new Error(response.message);

      Toast.show(_activeTab === 'clientes' ? '✅ Cobro registrado exitosamente' : '✅ Pago registrado exitosamente', 'success');
      _loadCtaCte();

      // Recargar datos en dashboard si está en segundo plano
      if (typeof Dashboard !== 'undefined' && typeof Dashboard.loadData === 'function') {
        Dashboard.loadData();
      }

    } catch (e) {
      Toast.show(e.message || 'Error al procesar operación', 'error');
    }
  }

  function _formatDate(fechaStr) {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fechaStr;
  }

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function destroy() {}

  return { render, init, marcarComoCobrado, destroy };
})();
