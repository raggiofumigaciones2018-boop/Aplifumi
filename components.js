/* ============================================
   APLIFUMI — Componentes UI Reutilizables
   Toast, Spinner, FormHelper, Render utils
   ============================================ */

/**
 * Sistema de notificaciones toast.
 * Muestra mensajes efímeros con auto-dismiss.
 */
const Toast = (() => {
  'use strict';

  /**
   * Muestra una notificación toast.
   * @param {string} message — Texto a mostrar.
   * @param {'success'|'error'|'warning'|'info'} type — Tipo de toast.
   * @param {number} duration — Milisegundos antes de auto-dismiss.
   * @returns {string} ID del toast creado.
   */
  function show(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return '';

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const config = {
      success: { icon: '✅', bg: 'bg-emerald-600', border: 'border-emerald-500/40' },
      error:   { icon: '❌', bg: 'bg-red-600',     border: 'border-red-500/40' },
      warning: { icon: '⚠️', bg: 'bg-amber-600',   border: 'border-amber-500/40' },
      info:    { icon: 'ℹ️', bg: 'bg-blue-600',    border: 'border-blue-500/40' },
    };

    const { icon, bg, border } = config[type] || config.info;

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast ${bg} ${border} border rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg text-white text-sm font-medium`;
    toast.innerHTML = `
      <span class="text-lg flex-shrink-0">${icon}</span>
      <span class="flex-1 leading-snug">${_escapeHtml(message)}</span>
      <button onclick="Toast.dismiss('${id}')" class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1" aria-label="Cerrar">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    const timeoutId = setTimeout(() => dismiss(id), duration);
    toast.dataset.timeoutId = timeoutId;

    return id;
  }

  /**
   * Cierra un toast manualmente.
   * @param {string} id — ID del toast a cerrar.
   */
  function dismiss(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    clearTimeout(Number(toast.dataset.timeoutId));
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }

  /** Escapa HTML para prevenir XSS en mensajes */
  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { show, dismiss };
})();


/**
 * Overlay de carga global.
 * Bloquea interacción mientras se procesa una operación.
 */
const Spinner = (() => {
  'use strict';

  let _overlay = null;

  function _getOverlay() {
    if (!_overlay) {
      _overlay = document.getElementById('loading-overlay');
    }
    return _overlay;
  }

  /** Muestra el overlay de carga */
  function show() {
    const overlay = _getOverlay();
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="flex flex-col items-center gap-3 animate-bounce-in">
        <div class="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
        <span class="text-sm font-medium text-white/80">Procesando...</span>
      </div>
    `;
  }

  /** Oculta el overlay de carga */
  function hide() {
    const overlay = _getOverlay();
    if (!overlay) return;
    overlay.classList.add('hidden');
  }

  /**
   * Retorna HTML para un spinner inline (dentro de un botón, por ejemplo).
   * @param {string} size — Tamaño CSS ('w-5 h-5').
   * @returns {string} HTML del spinner.
   */
  function inline(size = 'w-5 h-5') {
    return `<div class="${size} border-2 border-white/30 border-t-white rounded-full animate-spin"></div>`;
  }

  return { show, hide, inline };
})();


/**
 * Utilidades para formularios.
 * Gestión de estado de botones, validación y extracción de datos.
 */
const FormHelper = (() => {
  'use strict';

  /**
   * Deshabilita un botón y muestra spinner.
   * Previene doble clic durante envío.
   * @param {HTMLButtonElement} btn — Botón a deshabilitar.
   */
  function disableSubmit(btn) {
    if (!btn) return;
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${Spinner.inline()} <span>Guardando...</span>`;
  }

  /**
   * Rehabilita un botón después de completar la operación.
   * @param {HTMLButtonElement} btn — Botón a rehabilitar.
   * @param {string} [text] — Texto opcional para el botón.
   */
  function enableSubmit(btn, text) {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = text || btn.dataset.originalText || 'Guardar';
  }

  /**
   * Extrae los datos de un formulario como objeto plano.
   * @param {HTMLFormElement} form — Formulario del cual extraer datos.
   * @returns {Object} Datos del formulario.
   */
  function getFormData(form) {
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    }
    return data;
  }

  /**
   * Valida datos contra un conjunto de reglas.
   * @param {Object} data — Datos a validar.
   * @param {Array<{field: string, label: string, required?: boolean, min?: number}>} rules — Reglas de validación.
   * @returns {{valid: boolean, errors: string[]}} Resultado de validación.
   */
  function validate(data, rules) {
    const errors = [];

    for (const rule of rules) {
      const value = data[rule.field];

      if (rule.required && (!value || value === '')) {
        errors.push(`${rule.label} es obligatorio`);
        continue;
      }

      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`${rule.label} debe ser mayor a ${rule.min}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Resetea un formulario y sus estilos visuales.
   * @param {HTMLFormElement} form — Formulario a resetear.
   */
  function reset(form) {
    if (!form) return;
    form.reset();
    // Setear fecha de hoy como valor por defecto
    const fechaInput = form.querySelector('[name="fecha"]');
    if (fechaInput) {
      fechaInput.value = _getTodayString();
    }
  }

  /** Retorna la fecha de hoy en formato YYYY-MM-DD */
  function _getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  return { disableSubmit, enableSubmit, getFormData, validate, reset };
})();


/**
 * Utilidades de renderizado para estados visuales y formateo.
 * UI "tonta" — solo presenta datos, sin lógica de negocio.
 */
const Render = (() => {
  'use strict';

  /** Formateador de moneda ARS */
  const _currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  /** Formateador de fechas cortas */
  const _dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  /**
   * Formatea un número como moneda ARS.
   * @param {number|string} amount — Importe a formatear.
   * @returns {string} Importe formateado.
   */
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return _currencyFormatter.format(num);
  }

  /**
   * Formatea una fecha string a formato legible.
   * @param {string} dateStr — Fecha en formato YYYY-MM-DD u otro parseable.
   * @returns {string} Fecha formateada.
   */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return _dateFormatter.format(date);
    } catch {
      return dateStr;
    }
  }

  /**
   * Renderiza un estado vacío con ícono y mensaje.
   * @param {string} icon — Emoji o ícono.
   * @param {string} title — Título principal.
   * @param {string} subtitle — Descripción secundaria.
   * @returns {string} HTML del estado vacío.
   */
  function emptyState(icon, title, subtitle) {
    return `
      <div class="empty-state animate-fade-in-up">
        <div class="empty-icon">${icon}</div>
        <p class="empty-title">${title}</p>
        <p class="empty-subtitle">${subtitle}</p>
      </div>
    `;
  }

  /**
   * Renderiza un estado de error con opción de reintentar.
   * @param {string} message — Mensaje de error.
   * @param {string} [retryFnName] — Nombre de la función global para reintentar.
   * @returns {string} HTML del estado de error.
   */
  function errorState(message, retryFnName) {
    const retryBtn = retryFnName
      ? `<button onclick="${retryFnName}()" class="btn-secondary mt-4">
           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
           </svg>
           Reintentar
         </button>`
      : '';

    return `
      <div class="error-state animate-fade-in-up">
        <div class="error-icon">😔</div>
        <p class="error-title">Algo salió mal</p>
        <p class="error-subtitle">${message}</p>
        ${retryBtn}
      </div>
    `;
  }

  /**
   * Renderiza skeleton cards de carga.
   * @param {number} count — Cantidad de skeletons.
   * @returns {string} HTML de los skeletons.
   */
  function skeletonCards(count = 3) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push(`
        <div class="glass-card p-5 space-y-3">
          <div class="skeleton h-4 w-1/3"></div>
          <div class="skeleton h-8 w-2/3"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
      `);
    }
    return cards.join('');
  }

  /**
   * Renderiza skeleton filas para historial.
   * @param {number} count — Cantidad de filas.
   * @returns {string} HTML de los skeletons.
   */
  function skeletonRows(count = 5) {
    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push(`
        <div class="glass-card p-4 flex items-center gap-3">
          <div class="skeleton w-10 h-10 rounded-full flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-1/2"></div>
          </div>
          <div class="skeleton h-5 w-20"></div>
        </div>
      `);
    }
    return rows.join('');
  }

  /**
   * Retorna la fecha de hoy en formato YYYY-MM-DD.
   * @returns {string} Fecha de hoy.
   */
  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  return {
    formatCurrency,
    formatDate,
    emptyState,
    errorState,
    skeletonCards,
    skeletonRows,
    getTodayString,
  };
})();
