/* ============================================
   APLIFUMI — Módulo de Gastos
   Formulario de registro de gastos operativos
   ============================================ */

/**
 * Vista de registro de Gastos.
 * Formulario mobile-first con categorías y métodos de pago.
 */
const Gastos = (() => {
  'use strict';

  /** Categorías de gastos definidas en los requerimientos (almacén dinámico) */
  let _categoriasDb = [
    'Insumos',
    'Materiales',
    'Combustible',
    'Movilidad',
    'Servicios',
    'Impuestos',
    'Herramientas',
    'Otros',
  ];

  /** Métodos de pago disponibles */
  const METODOS_PAGO = [
    'Efectivo',
    'Transferencia',
    'Débito',
    'Crédito',
    'MercadoPago',
    'Cheque',
    'Otro',
  ];

  /** Lista predefinida de personas que pueden pagar */
  const PREDEFINED_PAGADORES = [
    'Emanuel', 'Carlos', 'Emiliano', 'Maximiliano'
  ];

  /** Reglas de validación para el formulario de gastos */
  const VALIDATION_RULES = [
    { field: 'fecha',      label: 'Fecha',       required: true },
    { field: 'proveedor',  label: 'Proveedor',   required: true },
    { field: 'detalle',    label: 'Detalle',     required: true },
    { field: 'categoria',  label: 'Categoría',   required: true },
    { field: 'importe',    label: 'Importe',     required: true, min: 1 },
    { field: 'metodoPago', label: 'Método Pago', required: true },
    { field: 'quienPago',  label: 'Quién pagó',  required: true },
    { field: 'abonado',    label: 'Abonado',     required: true },
  ];

  /** Almacén local de proveedores para autocompletado */
  let _proveedoresDb = [];

  /* ─── Renderizado ─── */

  /** Genera el HTML completo de la vista Gastos */
  function render() {
    return `
      <section id="gastos-view" class="space-y-4 animate-fade-in-up">
        <!-- Formulario -->
        <form id="form-gasto" class="space-y-4" novalidate>
          <div class="glass-card p-4 space-y-4">
            <!-- Primera Fila: Fecha y Importe -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="gasto-fecha" class="form-label">Fecha *</label>
                <input type="date" id="gasto-fecha" name="fecha" class="form-input" value="${Render.getTodayString()}" required>
              </div>
              <div>
                <label for="gasto-importe" class="form-label">Importe *</label>
                <input type="number" id="gasto-importe" name="importe" class="form-input" placeholder="0.00" min="1" step="0.01" required inputmode="decimal">
              </div>
            </div>

            <!-- Segunda Fila: Proveedor (datalist) y Detalle -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="gasto-proveedor" class="form-label">Proveedor *</label>
                <input type="text" id="gasto-proveedor" name="proveedor" class="form-input" placeholder="Buscar/Agregar..." list="datalist-proveedores" required autocomplete="off">
                <datalist id="datalist-proveedores"></datalist>
              </div>
              <div>
                <label for="gasto-detalle" class="form-label">Detalle *</label>
                <input type="text" id="gasto-detalle" name="detalle" class="form-input" placeholder="Detalle gasto" required autocomplete="off">
              </div>
            </div>

            <!-- Tercera Fila: Categoría (datalist inteligente) y Método Pago -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="gasto-categoria" class="form-label">Categoría *</label>
                <input type="text" id="gasto-categoria" name="categoria" class="form-input text-sm" placeholder="Buscar/Agregar..." list="datalist-gastos-categorias" required autocomplete="off">
                <datalist id="datalist-gastos-categorias">
                  ${_categoriasDb.map(cat => `<option value="${cat}"></option>`).join('')}
                </datalist>
              </div>
              <div>
                <label for="gasto-metodo-pago" class="form-label">Método Pago *</label>
                <select id="gasto-metodo-pago" name="metodoPago" class="form-input text-sm" required>
                  <option value="">Método</option>
                  ${METODOS_PAGO.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Cuarta Fila: Quién pagó y Abonado -->
            <div class="grid grid-cols-2 gap-3 items-center">
              <div>
                <label for="gasto-quien-pago" class="form-label">Quién pagó</label>
                <input type="text" id="gasto-quien-pago" name="quienPago" class="form-input opacity-75 cursor-not-allowed" readonly required style="background: var(--surface-secondary)">
              </div>
              <div class="flex items-center justify-between border rounded-xl p-2.5 h-[3rem] mt-5" style="background: var(--surface-secondary); border-color: var(--surface-border)">
                <div>
                  <p class="text-xs font-semibold" style="color: var(--text-primary)">Abonado</p>
                </div>
                <label class="toggle-switch transform scale-90">
                  <input type="checkbox" id="gasto-abonado" name="abonado" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Botón Guardar Gasto -->
            <div class="pt-2">
              <button type="submit" id="btn-guardar-gasto" class="btn-primary w-full" style="background: linear-gradient(135deg, var(--color-expense), #e11d48); min-height: 2.75rem;">
                Guardar Gasto
              </button>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  /** Inicializa eventos del formulario */
  async function init() {
    const form = document.getElementById('form-gasto');
    if (!form) return;

    form.addEventListener('submit', _handleSubmit);

    // Auto-rellenar y bloquear "Quién pagó" con el usuario logueado
    const quienPagoInput = document.getElementById('gasto-quien-pago');
    if (quienPagoInput) {
      try {
        const sessionStr = localStorage.getItem('aplifumi-session') || sessionStorage.getItem('aplifumi-session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const emailObj = session.email || '';
          // Extrae el nombre antes del '@' y capitaliza primera letra (ej: 'emanuel@gmail.com' -> 'Emanuel')
          let displayName = emailObj.split('@')[0];
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          quienPagoInput.value = displayName;
        }
      } catch (e) {
        console.error('Error al auto-rellenar pagador', e);
      }
    }

    const providerInput = document.getElementById('gasto-proveedor');
    if (providerInput) {
      providerInput.addEventListener('input', _handleProviderSelection);
    }

    await _fetchProveedoresDb();
  }

  /** Detecta cuando se selecciona un proveedor para auto-rellenar su Rubro como Categoría */
  function _handleProviderSelection(event) {
    const selectedName = event.target.value;
    const provider = _proveedoresDb.find(p => (p.Nombre || p.nombre || '').toLowerCase() === selectedName.toLowerCase());

    if (provider) {
      const categoryInput = document.getElementById('gasto-categoria');
      if (categoryInput) {
        // En base de datos de proveedores, el campo suele llamarse 'Rubro' o 'rubro'
        const rubro = provider.Rubro || provider.rubro || '';
        if (rubro) {
          categoryInput.value = rubro;
          Toast.show(`Categoría auto-rellenada: ${rubro}`, 'info', 1500);
        }
      }
    }
  }

  /** Obtiene la lista de proveedores del servidor */
  async function _fetchProveedoresDb() {
    try {
      const res = await Api.getProveedores();
      if (res.success && res.data) {
        _proveedoresDb = res.data;
        const provNames = _proveedoresDb.map(p => p.Nombre || p.nombre);
        _fillDatalist('datalist-proveedores', provNames);
      }
    } catch (e) {
      console.error('Error al descargar base de datos de proveedores', e);
    }
  }

  /** Rellena un datalist específico con opciones */
  function _fillDatalist(elementId, items) {
    const dl = document.getElementById(elementId);
    if (!dl) return;
    dl.innerHTML = items.map(item => `<option value="${_escapeHtml(item)}"></option>`).join('');
  }

  /** Maneja el envío del formulario */
  async function _handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const btn = document.getElementById('btn-guardar-gasto');
    const data = FormHelper.getFormData(form);

    data.abonado = document.getElementById('gasto-abonado').checked ? 'SI' : 'NO';

    // Validar campos obligatorios
    const validation = FormHelper.validate(data, VALIDATION_RULES);
    if (!validation.valid) {
      Toast.show(validation.errors[0], 'error');
      return;
    }

    // Deshabilitar botón y mostrar spinner
    FormHelper.disableSubmit(btn);

    try {
      const response = await Api.createGasto(data);

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar');
      }

      // Si el proveedor ingresado no existe en nuestra base de datos, lo creamos automáticamente
      const exists = _proveedoresDb.some(p => (p.Nombre || p.nombre).toLowerCase() === data.proveedor.toLowerCase());
      if (!exists) {
        await Api.createProveedor({ nombre: data.proveedor, rubro: 'Otros' });
      }

      // Si la categoría es nueva, agregarla localmente a las sugerencias
      const catNormalized = data.categoria.trim();
      const catExists = _categoriasDb.some(cat => cat.toLowerCase() === catNormalized.toLowerCase());
      if (catNormalized && !catExists) {
        _categoriasDb.push(catNormalized);
        _categoriasDb.sort();
        const dl = document.getElementById('datalist-gastos-categorias');
        if (dl) {
          dl.innerHTML = _categoriasDb.map(c => `<option value="${_escapeHtml(c)}"></option>`).join('');
        }
      }

      Toast.show('✅ Gasto guardado correctamente', 'success');
      FormHelper.reset(form);

      // Restablecer el usuario logueado en "Quién pagó"
      try {
        const sessionStr = localStorage.getItem('aplifumi-session') || sessionStorage.getItem('aplifumi-session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const emailObj = session.email || '';
          let displayName = emailObj.split('@')[0];
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          const inputQP = document.getElementById('gasto-quien-pago');
          if (inputQP) inputQP.value = displayName;
        }
      } catch (e) {
        console.error(e);
      }

      document.getElementById('gasto-abonado').checked = true; // Por requerimiento: predeterminado siempre checked
      await _fetchProveedoresDb();

    } catch (error) {
      Toast.show(error.message || 'Error de conexión', 'error');
    } finally {
      FormHelper.enableSubmit(btn, `
        Guardar Gasto
      `);
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Limpieza al salir de la vista */
  function destroy() {
    const form = document.getElementById('form-gasto');
    if (form) {
      form.removeEventListener('submit', _handleSubmit);
    }
    const providerInput = document.getElementById('gasto-proveedor');
    if (providerInput) {
      providerInput.removeEventListener('input', _handleProviderSelection);
    }
  }

  return { render, init, destroy };
})();
