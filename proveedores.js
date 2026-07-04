const Proveedores = (() => {
  'use strict';

  /** Reglas de validación */
  const VALIDATION_RULES = [
    { field: 'nombre', label: 'Nombre', required: true },
    { field: 'rubro',  label: 'Rubro / Categoría', required: true },
  ];

  /** Categorías de gastos (Rubros) definidas en los requerimientos (almacén dinámico) */
  let _categoriasDb = [
    'Insumos', 'Materiales', 'Combustible', 'Movilidad',
    'Servicios', 'Impuestos', 'Herramientas', 'Otros'
  ];

  /** ID del proveedor que se está editando (null si es creación) */
  let _editingId = null;

  /* ─── Renderizado ─── */

  function render() {
    return `
      <section id="proveedores-view" class="space-y-5 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header">
          <h1 class="section-title">
            <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Proveedores
          </h1>
        </div>

        <!-- Formulario -->
        <form id="form-proveedor" class="space-y-4" novalidate>
          <div class="glass-card p-4 space-y-4">
            <div class="flex justify-between items-center">
              <h2 id="proveedor-form-title" class="text-sm font-semibold uppercase tracking-wider" style="color: var(--text-secondary)">
                Nuevo Proveedor
              </h2>
              <button type="button" id="btn-cancel-proveedor-edit" class="hidden text-xs font-bold text-rose-400 hover:underline">
                Cancelar Edición
              </button>
            </div>

            <div>
              <label for="proveedor-nombre" class="form-label">Nombre del Proveedor *</label>
              <input type="text" id="proveedor-nombre" name="nombre" class="form-input" placeholder="Nombre completo o Razón Social" required autocomplete="off">
            </div>

            <div>
              <label for="proveedor-rubro" class="form-label">Rubro / Categoría *</label>
              <input type="text" id="proveedor-rubro" name="rubro" class="form-input" placeholder="Buscar/Agregar..." list="datalist-proveedor-rubros" required autocomplete="off">
              <datalist id="datalist-proveedor-rubros">
                ${_categoriasDb.map(cat => `<option value="${cat}"></option>`).join('')}
              </datalist>
            </div>

            <div>
              <label for="proveedor-telefono" class="form-label">Teléfono (Opcional)</label>
              <input type="tel" id="proveedor-telefono" name="telefono" class="form-input" placeholder="Ej: 2254123456" inputmode="tel">
            </div>
          </div>

          <button type="submit" id="btn-guardar-proveedor" class="btn-primary">
            Guardar Proveedor
          </button>
        </form>

        <!-- Listado rápido -->
        <div class="glass-card p-4 space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--text-secondary)">
            Listado de Proveedores
          </h2>
          <div id="proveedores-lista" class="space-y-2 max-h-60 overflow-y-auto">
            <div class="text-center text-sm py-4" style="color: var(--text-tertiary)">Cargando proveedores...</div>
          </div>
        </div>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  function init() {
    _editingId = null;
    const form = document.getElementById('form-proveedor');
    if (form) {
      form.addEventListener('submit', _handleSubmit);
    }

    const cancelBtn = document.getElementById('btn-cancel-proveedor-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', _clearEditMode);
    }

    const lista = document.getElementById('proveedores-lista');
    if (lista) {
      lista.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-proveedor');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          const nombre = editBtn.getAttribute('data-nombre');
          const rubro = editBtn.getAttribute('data-rubro');
          const telefono = editBtn.getAttribute('data-telefono');
          _enterEditMode(id, nombre, rubro, telefono);
        }
      });
    }

    _loadProveedores();
  }

  function _enterEditMode(id, nombre, rubro, telefono) {
    _editingId = id;

    document.getElementById('proveedor-nombre').value = nombre || '';
    document.getElementById('proveedor-rubro').value = rubro || '';
    document.getElementById('proveedor-telefono').value = telefono || '';

    document.getElementById('proveedor-form-title').textContent = 'Editar Proveedor';
    document.getElementById('btn-guardar-proveedor').textContent = 'Actualizar Proveedor';
    document.getElementById('btn-cancel-proveedor-edit').classList.remove('hidden');

    const form = document.getElementById('form-proveedor');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function _clearEditMode() {
    _editingId = null;
    const form = document.getElementById('form-proveedor');
    if (form) FormHelper.reset(form);

    document.getElementById('proveedor-form-title').textContent = 'Nuevo Proveedor';
    document.getElementById('btn-guardar-proveedor').textContent = 'Guardar Proveedor';
    document.getElementById('btn-cancel-proveedor-edit').classList.add('hidden');
  }

  async function _loadProveedores() {
    const lista = document.getElementById('proveedores-lista');
    if (!lista) return;

    try {
      const response = await Api.getProveedores();
      if (!response.success) throw new Error(response.message);

      const items = response.data || [];
      if (items.length === 0) {
        lista.innerHTML = `<div class="text-center text-sm py-4" style="color: var(--text-tertiary)">Sin proveedores registrados.</div>`;
        return;
      }

      lista.innerHTML = items.map(p => `
        <div class="p-3 rounded-lg border flex items-center justify-between gap-3" style="background: var(--surface-secondary); border-color: var(--surface-border)">
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="font-semibold text-sm text-[var(--text-primary)] truncate">${_escapeHtml(p.Nombre || p.nombre)}</span>
            <span class="text-xs text-[var(--text-secondary)] truncate">📁 Categoría: ${_escapeHtml(p.Rubro || p.rubro)}</span>
            ${p.Teléfono || p.telefono ? `<span class="text-xs text-[var(--text-tertiary)]">📞 ${_escapeHtml(p.Teléfono || p.telefono)}</span>` : ''}
          </div>
          <button type="button" class="btn-edit-proveedor p-2 rounded-lg bg-[var(--surface-primary)] hover:bg-[var(--surface-border)] text-violet-400 transition-all flex-shrink-0"
            data-id="${_escapeHtml(p.Id || p.id)}"
            data-nombre="${_escapeHtml(p.Nombre || p.nombre)}"
            data-rubro="${_escapeHtml(p.Rubro || p.rubro)}"
            data-telefono="${_escapeHtml(p.Teléfono || p.telefono || '')}"
            aria-label="Editar Proveedor"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      `).join('');

    } catch (e) {
      lista.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">Error al cargar proveedores: ${e.message}</div>`;
    }
  }

  async function _handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById('btn-guardar-proveedor');
    const data = FormHelper.getFormData(form);

    const validation = FormHelper.validate(data, VALIDATION_RULES);
    if (!validation.valid) {
      Toast.show(validation.errors[0], 'error');
      return;
    }

    FormHelper.disableSubmit(btn);

    try {
      let response;
      if (_editingId) {
        data.id = _editingId;
        response = await Api.updateProveedor(data);
      } else {
        response = await Api.createProveedor(data);
      }

      if (!response.success) throw new Error(response.message);

      // Si el rubro es nuevo, agregarlo dinámicamente al datalist en memoria
      const rubroNormalized = data.rubro.trim();
      const exists = _categoriasDb.some(c => c.toLowerCase() === rubroNormalized.toLowerCase());
      if (rubroNormalized && !exists) {
        _categoriasDb.push(rubroNormalized);
        _categoriasDb.sort();
        const dl = document.getElementById('datalist-proveedor-rubros');
        if (dl) {
          dl.innerHTML = _categoriasDb.map(c => `<option value="${_escapeHtml(c)}"></option>`).join('');
        }
      }

      Toast.show(_editingId ? '✅ Proveedor actualizado correctamente' : '✅ Proveedor guardado correctamente', 'success');
      _clearEditMode();
      _loadProveedores();

    } catch (e) {
      Toast.show(e.message || 'Error al conectar', 'error');
    } finally {
      FormHelper.enableSubmit(btn, _editingId ? 'Actualizar Proveedor' : 'Guardar Proveedor');
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function destroy() {
    const form = document.getElementById('form-proveedor');
    if (form) {
      form.removeEventListener('submit', _handleSubmit);
    }
  }

  return { render, init, destroy };
})();
