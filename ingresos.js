const Ingresos = (() => {
  'use strict';

  /** Lista por defecto y fija de servicios prestados para precargar */
  const PREDEFINED_SERVICIOS = [
    'Abejas', 'Acaros', 'Arañas', 'Avispas', 'Bichos Bolitas', 'Bichos taladros',
    'Caracoles', 'Certificado', 'Chinches de cama', 'Control Bimestral',
    'Control General', 'Control Mensual', 'Control Trimestral', 'Cucarachas',
    'Desinfección', 'Fumigación General', 'Garrapatas', 'Gata Peluda',
    'Gorgojos', 'Grillos Topo', 'Hormigas', 'Insumos', 'Malezas', 'Moscas',
    'Mosquitos', 'Murciélagos', 'Palomas', 'Productos', 'Pulgas', 'Ratas'
  ];

  /** Lista por defecto y fija de localidades */
  const PREDEFINED_LOCALIDADES = [
    'Aguas verdes', 'Carilo', 'Costa Azul', 'Costa del Este', 'Costa Esmeralda',
    'Dolores', 'La Lucila del Mar', 'Las Toninas', 'Lavalle', 'Madariaga',
    'Mar de Ajo', 'Mar del Tuyu', 'Nueva Atlantis', 'Ostende', 'Pinamar',
    'Punta Medanos', 'Rincón de cobos', 'San Bernardo', 'San Clemente',
    'Santa Teresita', 'Valeria del Mar', 'Villa Gesel', 'Villa Gesell', 'Villa Robles'
  ];

  /** Lista predefinida de cobradores del servicio */
  const PREDEFINED_COBRADORES = [
    'Emanuel', 'Carlos', 'Emiliano', 'Maximiliano'
  ];

  /** Reglas de validación para el formulario de ingresos */
  const VALIDATION_RULES = [
    { field: 'fecha',      label: 'Fecha',             required: true },
    { field: 'cliente',    label: 'Cliente',           required: true },
    { field: 'localidad',  label: 'Localidad',         required: true },
    { field: 'direccion',  label: 'Dirección',         required: true },
    { field: 'servicio',   label: 'Servicio Prestado', required: true },
    { field: 'importe',    label: 'Importe',           required: true, min: 1 },
    { field: 'quienCobra', label: 'Quién cobra',       required: true },
  ];

  /** Almacén local de clientes detallados para autocompletado */
  let _clientesDb = [];

  /* ─── Renderizado ─── */

  /** Genera el HTML completo de la vista Ingresos */
  function render() {
    return `
      <section id="ingresos-view" class="space-y-4 animate-fade-in-up">
        <!-- Formulario -->
        <form id="form-ingreso" class="space-y-4" novalidate>
          <div class="glass-card p-4 space-y-4">
            <!-- Primera Fila: Fecha y Importe -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ingreso-fecha" class="form-label">Fecha *</label>
                <input type="date" id="ingreso-fecha" name="fecha" class="form-input" value="${Render.getTodayString()}" required>
              </div>
              <div>
                <label for="ingreso-importe" class="form-label">Importe *</label>
                <input type="number" id="ingreso-importe" name="importe" class="form-input" placeholder="0.00" min="1" step="0.01" required inputmode="decimal">
              </div>
            </div>

            <!-- Segunda Fila: Cliente y Quién cobra -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ingreso-cliente" class="form-label">Cliente *</label>
                <input type="text" id="ingreso-cliente" name="cliente" class="form-input" placeholder="Buscar/Agregar..." list="datalist-clientes" required autocomplete="off">
                <datalist id="datalist-clientes"></datalist>
              </div>
              <div>
                <label for="ingreso-quien-cobra" class="form-label">Quién cobra</label>
                <input type="text" id="ingreso-quien-cobra" name="quienCobra" class="form-input opacity-75 cursor-not-allowed" readonly required style="background: var(--surface-secondary)">
              </div>
            </div>

            <!-- Tercera Fila: Localidad y Dirección -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ingreso-localidad" class="form-label">Localidad *</label>
                <input type="text" id="ingreso-localidad" name="localidad" class="form-input" placeholder="Localidad" list="datalist-localidades" required autocomplete="off">
                <datalist id="datalist-localidades"></datalist>
              </div>
              <div>
                <label for="ingreso-direccion" class="form-label">Dirección *</label>
                <input type="text" id="ingreso-direccion" name="direccion" class="form-input" placeholder="Dirección" required autocomplete="off">
              </div>
            </div>

            <!-- Cuarta Fila: Servicio Prestado y Teléfono -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="ingreso-servicio" class="form-label">Servicio *</label>
                <input type="text" id="ingreso-servicio" name="servicio" class="form-input" placeholder="Ej: Control Mensual" list="datalist-servicios" required autocomplete="off">
                <datalist id="datalist-servicios"></datalist>
              </div>
              <div>
                <label for="ingreso-telefono" class="form-label">Teléfono (Opc.)</label>
                <input type="tel" id="ingreso-telefono" name="telefono" class="form-input" placeholder="Contacto" inputmode="tel">
              </div>
            </div>

            <!-- Quinta Fila: Abonado y Botón Guardar -->
            <div class="grid grid-cols-2 gap-3 items-center pt-2">
              <div class="flex items-center justify-between border rounded-xl p-2.5" style="background: var(--surface-secondary); border-color: var(--surface-border)">
                <div>
                  <p class="text-xs font-semibold" style="color: var(--text-primary)">Abonado</p>
                </div>
                <label class="toggle-switch transform scale-90">
                  <input type="checkbox" id="ingreso-abonado" name="abonado" checked>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div>
                <button type="submit" id="btn-guardar-ingreso" class="btn-primary w-full" style="min-height: 2.75rem;">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  /* ─── Inicialización ─── */

  /** Inicializa eventos del formulario y carga datalists */
  async function init() {
    const form = document.getElementById('form-ingreso');
    if (!form) return;

    form.addEventListener('submit', _handleSubmit);

    const clientInput = document.getElementById('ingreso-cliente');
    if (clientInput) {
      clientInput.addEventListener('input', _handleClientSelection);
    }

    // Auto-rellenar y bloquear "Quién cobra" con el usuario logueado
    const quienCobraInput = document.getElementById('ingreso-quien-cobra');
    if (quienCobraInput) {
      try {
        const sessionStr = localStorage.getItem('aplifumi-session') || sessionStorage.getItem('aplifumi-session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const emailObj = session.email || '';
          // Extrae el nombre antes del '@' y capitaliza primera letra (ej: 'emanuel@gmail.com' -> 'Emanuel')
          let displayName = emailObj.split('@')[0];
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          quienCobraInput.value = displayName;
        }
      } catch (e) {
        console.error('Error al auto-rellenar cobrador', e);
      }
    }

    _loadDatalists();
    await _fetchClientesDb();
  }

  /** Obtiene la base de datos de Clientes desde la API */
  async function _fetchClientesDb() {
    try {
      const res = await Api.getClientes();
      if (res.success && res.data) {
        _clientesDb = res.data;
        // Rellenar datalist de clientes
        const clientNames = _clientesDb.map(c => c.Nombre || c.nombre);
        _fillDatalist('datalist-clientes', clientNames);
      }
    } catch (e) {
      console.error('Error al descargar base de datos de clientes', e);
    }
  }

  /** Detecta cuando se selecciona un cliente del datalist para auto-rellenar los datos */
  function _handleClientSelection(event) {
    const selectedName = event.target.value;
    const client = _clientesDb.find(c => (c.Nombre || c.nombre) === selectedName);

    if (client) {
      const localidadInput = document.getElementById('ingreso-localidad');
      const direccionInput = document.getElementById('ingreso-direccion');
      const telefonoInput = document.getElementById('ingreso-telefono');

      if (localidadInput) localidadInput.value = client.Localidad || client.localidad || '';
      if (direccionInput) direccionInput.value = client.Dirección || client.direccion || '';
      if (telefonoInput) telefonoInput.value = client.Teléfono || client.telefono || '';
      
      Toast.show(`Autocompletado cliente: ${selectedName}`, 'info', 1500);
    }
  }

  /** Carga y rellena los datalists desde localStorage y constantes predefinidas */
  function _loadDatalists() {
    const history = _getHistory();

    // Localidades predefinidas + histórico
    const todasLasLocalidades = [...new Set([...PREDEFINED_LOCALIDADES, ...history.localidades])];
    _fillDatalist('datalist-localidades', todasLasLocalidades);

    // Servicios predefinidos + histórico
    const todosLosServicios = [...new Set([...PREDEFINED_SERVICIOS, ...history.servicios])];
    _fillDatalist('datalist-servicios', todosLosServicios);

    // Cobradores predefinidos
    _fillDatalist('datalist-cobradores', PREDEFINED_COBRADORES);
  }

  /** Rellena un datalist específico con opciones */
  function _fillDatalist(elementId, items) {
    const dl = document.getElementById(elementId);
    if (!dl) return;
    dl.innerHTML = items.map(item => `<option value="${_escapeHtml(item)}"></option>`).join('');
  }

  /** Obtiene listas del historial guardadas en localStorage */
  function _getHistory() {
    try {
      const stored = localStorage.getItem('aplifumi-history');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error al leer historial para autocompletar', e);
    }
    return { clientes: [], localidades: [], servicios: [] };
  }

  /** Guarda un nuevo valor en el historial de localStorage si no existe */
  function _saveToHistory(cliente, localidad, servicio) {
    const history = _getHistory();

    if (cliente && !history.clientes.includes(cliente)) {
      history.clientes.push(cliente);
      if (history.clientes.length > 20) history.clientes.shift();
    }
    if (localidad && !PREDEFINED_LOCALIDADES.includes(localidad) && !history.localidades.includes(localidad)) {
      history.localidades.push(localidad);
      if (history.localidades.length > 20) history.localidades.shift();
    }
    if (servicio && !PREDEFINED_SERVICIOS.includes(servicio) && !history.servicios.includes(servicio)) {
      history.servicios.push(servicio);
      if (history.servicios.length > 20) history.servicios.shift();
    }

    try {
      localStorage.setItem('aplifumi-history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }

  /** Maneja el envío del formulario */
  async function _handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const btn = document.getElementById('btn-guardar-ingreso');
    const data = FormHelper.getFormData(form);

    data.abonado = document.getElementById('ingreso-abonado').checked ? 'SI' : 'NO';

    const validation = FormHelper.validate(data, VALIDATION_RULES);
    if (!validation.valid) {
      Toast.show(validation.errors[0], 'error');
      return;
    }

    FormHelper.disableSubmit(btn);

    try {
      const response = await Api.createIngreso(data);

      if (!response.success) {
        throw new Error(response.message || 'Error al guardar');
      }

      _saveToHistory(data.cliente, data.localidad, data.servicio);

      Toast.show('✅ Ingreso guardado correctamente', 'success');
      FormHelper.reset(form);

      // Restablecer el usuario logueado en "Quién cobra"
      try {
        const sessionStr = localStorage.getItem('aplifumi-session') || sessionStorage.getItem('aplifumi-session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const emailObj = session.email || '';
          let displayName = emailObj.split('@')[0];
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          const inputQC = document.getElementById('ingreso-quien-cobra');
          if (inputQC) inputQC.value = displayName;
        }
      } catch (e) {
        console.error(e);
      }

      document.getElementById('ingreso-abonado').checked = true; // Por requerimiento: predeterminado siempre checked
      _loadDatalists();
      await _fetchClientesDb();

    } catch (error) {
      Toast.show(error.message || 'Error de conexión', 'error');
    } finally {
      FormHelper.enableSubmit(btn, `
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        Guardar Ingreso
      `);
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function destroy() {
    const form = document.getElementById('form-ingreso');
    if (form) {
      form.removeEventListener('submit', _handleSubmit);
    }
    const clientInput = document.getElementById('ingreso-cliente');
    if (clientInput) {
      clientInput.removeEventListener('input', _handleClientSelection);
    }
  }

  return { render, init, destroy };
})();
