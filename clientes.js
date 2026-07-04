/* ============================================
   APLIFUMI — Módulo de Clientes
   Formulario de creación y administración de clientes
   ============================================ */

/**
 * Módulo de Clientes.
 * Permite registrar y listar los clientes del sistema.
 */
const Clientes = (() => {
  'use strict';

  /** Reglas de validación */
  const VALIDATION_RULES = [
    { field: 'nombre',    label: 'Nombre',    required: true },
    { field: 'localidad', label: 'Localidad', required: true },
    { field: 'direccion', label: 'Dirección', required: true },
  ];

  /** Localidades definidas en los requerimientos */
  let _localidadesDb = [
    'Carilo',
    'Pinamar',
    'Ostende',
    'Valeria del Mar',
    'Madariaga'
  ];

  /** ID del cliente que se está editando (null si es creación) */
  let _editingId = null;

  /* ─── Renderizado ─── */

  function render() {
    return `
      <section id="clientes-view" class="space-y-5 animate-fade-in-up">
        <!-- Header -->
        <div class="section-header">
          <h1 class="section-title">
            <svg class="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Clientes
          </h1>
        </div>

        <!-- Formulario -->
        <form id="form-cliente" class="space-y-4" novalidate>
          <div class="glass-card p-4 space-y-4">
            <div class="flex justify-between items-center">
              <h2 id="cliente-form-title" class="text-sm font-semibold uppercase tracking-wider" style="color: var(--text-secondary)">
                Nuevo Cliente
              </h2>
              <button type="button" id="btn-cancel-edit" class="hidden text-xs font-bold text-rose-400 hover:underline">
                Cancelar Edición
              </button>
            </div>

            <div>
              <label for="cliente-nombre" class="form-label">Nombre del Cliente *</label>
              <input type="text" id="cliente-nombre" name="nombre" class="form-input" placeholder="Nombre completo o Empresa" required autocomplete="off">
            </div>

            <div>
              <label for="cliente-localidad" class="form-label">Localidad *</label>
              <input type="text" id="cliente-localidad" name="localidad" class="form-input" placeholder="Ciudad o localidad" list="datalist-cliente-localidades" required autocomplete="off">
              <datalist id="datalist-cliente-localidades">
                ${_localidadesDb.map(l => `<option value="${l}"></option>`).join('')}
              </datalist>
            </div>

            <div>
              <label for="cliente-direccion" class="form-label">Dirección *</label>
              <input type="text" id="cliente-direccion" name="direccion" class="form-input" placeholder="Dirección del domicilio" required autocomplete="off">
            </div>

            <div>
              <label for="cliente-telefono" class="form-label">Teléfono (Opcional)</label>
              <input type="tel" id="cliente-telefono" name="telefono" class="form-input" placeholder="Ej: 2254123456" inputmode="tel">
            </div>
          </div>

          <button type="submit" id="btn-guardar-cliente" class="btn-primary">
            Guardar Cliente
          </button>
        </form>

        <!-- Listado rápido -->
        <div class="glass-card p-4 space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--text-secondary)">
            Listado de Clientes
          </h2>
          <div id="clientes-lista" class="space-y-2 max-h-60 overflow-y-auto">
            <div class="text-center text-sm py-4" style="color: var(--text-tertiary)">Cargando clientes...</div>
          </div>
        </div>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  function init() {
    _editingId = null;
    const form = document.getElementById('form-cliente');
    if (form) {
      form.addEventListener('submit', _handleSubmit);
    }

    const cancelBtn = document.getElementById('btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', _clearEditMode);
    }

    const lista = document.getElementById('clientes-lista');
    if (lista) {
      lista.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-cliente');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          const nombre = editBtn.getAttribute('data-nombre');
          const localidad = editBtn.getAttribute('data-localidad');
          const direccion = editBtn.getAttribute('data-direccion');
          const telefono = editBtn.getAttribute('data-telefono');
          _enterEditMode(id, nombre, localidad, direccion, telefono);
        }
      });
    }

    _loadClientes();
  }

  function _enterEditMode(id, nombre, localidad, direccion, telefono) {
    _editingId = id;
    
    document.getElementById('cliente-nombre').value = nombre || '';
    document.getElementById('cliente-localidad').value = localidad || '';
    document.getElementById('cliente-direccion').value = direccion || '';
    document.getElementById('cliente-telefono').value = telefono || '';

    document.getElementById('cliente-form-title').textContent = 'Editar Cliente';
    document.getElementById('btn-guardar-cliente').textContent = 'Actualizar Cliente';
    document.getElementById('btn-cancel-edit').classList.remove('hidden');

    // Desplazar al formulario de edición
    const form = document.getElementById('form-cliente');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function _clearEditMode() {
    _editingId = null;
    const form = document.getElementById('form-cliente');
    if (form) FormHelper.reset(form);

    document.getElementById('cliente-form-title').textContent = 'Nuevo Cliente';
    document.getElementById('btn-guardar-cliente').textContent = 'Guardar Cliente';
    document.getElementById('btn-cancel-edit').classList.add('hidden');
  }

  async function _loadClientes() {
    const lista = document.getElementById('clientes-lista');
    if (!lista) return;

    try {
      const response = await Api.getClientes();
      if (!response.success) throw new Error(response.message);

      const items = response.data || [];
      if (items.length === 0) {
        lista.innerHTML = `<div class="text-center text-sm py-4" style="color: var(--text-tertiary)">Sin clientes registrados.</div>`;
        return;
      }

      lista.innerHTML = items.map(c => `
        <div class="p-3 rounded-lg border flex items-center justify-between gap-3" style="background: var(--surface-secondary); border-color: var(--surface-border)">
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="font-semibold text-sm text-[var(--text-primary)] truncate">${_escapeHtml(c.Nombre || c.nombre)}</span>
            <span class="text-xs text-[var(--text-secondary)] truncate">📍 ${_escapeHtml(c.Dirección || c.direccion)}, ${_escapeHtml(c.Localidad || c.localidad)}</span>
            ${c.Teléfono || c.telefono ? `<span class="text-xs text-[var(--text-tertiary)]">📞 ${_escapeHtml(c.Teléfono || c.telefono)}</span>` : ''}
          </div>
          <button type="button" class="btn-edit-cliente p-2 rounded-lg bg-[var(--surface-primary)] hover:bg-[var(--surface-border)] text-violet-400 transition-all flex-shrink-0"
            data-id="${_escapeHtml(c.Id || c.id)}"
            data-nombre="${_escapeHtml(c.Nombre || c.nombre)}"
            data-localidad="${_escapeHtml(c.Localidad || c.localidad)}"
            data-direccion="${_escapeHtml(c.Dirección || c.direccion)}"
            data-telefono="${_escapeHtml(c.Teléfono || c.telefono || '')}"
            aria-label="Editar Cliente"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      `).join('');

    } catch (e) {
      lista.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">Error al cargar clientes: ${e.message}</div>`;
    }
  }

  async function _handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById('btn-guardar-cliente');
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
        response = await Api.updateCliente(data);
      } else {
        response = await Api.createCliente(data);
      }

      if (!response.success) throw new Error(response.message);

      // Agregar localidad nueva a la lista de sugerencias si no existía
      const locNormalized = data.localidad.trim();
      const exists = _localidadesDb.some(l => l.toLowerCase() === locNormalized.toLowerCase());
      if (locNormalized && !exists) {
        _localidadesDb.push(locNormalized);
        _localidadesDb.sort();
        
        const dl = document.getElementById('datalist-cliente-localidades');
        if (dl) {
          dl.innerHTML = _localidadesDb.map(l => `<option value="${_escapeHtml(l)}"></option>`).join('');
        }
      }

      Toast.show(_editingId ? '✅ Cliente actualizado correctamente' : '✅ Cliente guardado correctamente', 'success');
      _clearEditMode();
      _loadClientes();

    } catch (e) {
      Toast.show(e.message || 'Error al conectar', 'error');
    } finally {
      FormHelper.enableSubmit(btn, _editingId ? 'Actualizar Cliente' : 'Guardar Cliente');
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function destroy() {
    const form = document.getElementById('form-cliente');
    if (form) {
      form.removeEventListener('submit', _handleSubmit);
    }
  }

  return { render, init, destroy };
})();
