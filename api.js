/* ============================================
   APLIFUMI — Capa de Comunicación con API
   Wrapper sobre Fetch para Google Apps Script
   ============================================ */

/**
 * Módulo de comunicación con el backend (Google Apps Script).
 * Centraliza todas las llamadas HTTP y manejo de errores.
 *
 * IMPORTANTE: Configurar API_BASE con la URL del Web App desplegado.
 */
const Api = (() => {
  'use strict';

  /* ─── Configuración ─── */

  /**
   * URL base del Web App de Google Apps Script.
   * Reemplazar con la URL real después del deploy.
   * Ejemplo: 'https://script.google.com/macros/s/AKfycb.../exec'
   */
  const API_BASE = 'https://script.google.com/macros/s/AKfycbwH-laD4bQw2GjOypZmgZmMyE9a5a18wHGc2NetI-PQsMlPjp9_KHw1g1e07-Ka83Az/exec';

  /** Timeout máximo para cada request (ms) */
  const REQUEST_TIMEOUT = 15000;

  /** Máximo de reintentos para errores de red */
  const MAX_RETRIES = 2;

  /* ─── Funciones Internas ─── */

  /**
   * Realiza una petición HTTP con timeout y reintentos.
   * @param {string} url — URL completa.
   * @param {Object} options — Opciones de fetch.
   * @param {number} retries — Reintentos restantes.
   * @returns {Promise<Object>} Respuesta parseada como JSON.
   */
  async function _request(url, options = {}, retries = MAX_RETRIES) {
    // Validar que API_BASE esté configurada
    if (!API_BASE) {
      return _mockResponse(url, options);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Reintentar en caso de error de red
      if (retries > 0 && _isRetryableError(error)) {
        await _delay(1000 * (MAX_RETRIES - retries + 1));
        return _request(url, options, retries - 1);
      }

      // Error de timeout
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Verificá tu conexión.');
      }

      throw new Error(error.message || 'Error de conexión con el servidor.');
    }
  }

  /** Determina si un error es reintentable (problemas de red) */
  function _isRetryableError(error) {
    return (
      error.name === 'TypeError' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    );
  }

  /** Delay helper para reintentos */
  function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Realiza una petición GET.
   * @param {string} action — Nombre de la acción.
   * @param {Object} [params] — Parámetros query adicionales.
   * @returns {Promise<Object>} Respuesta JSON.
   */
  async function _get(action, params = {}) {
    const queryParams = new URLSearchParams({ action, ...params });
    const url = `${API_BASE}?${queryParams.toString()}`;
    return _request(url, { method: 'GET' });
  }

  /**
   * Realiza una petición POST.
   * Usa Content-Type: text/plain para evitar CORS preflight.
   * @param {string} action — Nombre de la acción.
   * @param {Object} data — Datos a enviar.
   * @returns {Promise<Object>} Respuesta JSON.
   */
  async function _post(action, data = {}) {
    return _request(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
    });
  }

  /* ─── Mock API (modo desarrollo sin backend) ─── */

  /** Datos mock para desarrollo local sin backend */
  const _mockData = {
    ingresos: [],
    gastos: [],
    clientes: [
      { id: 'CLI-1', nombre: 'Juan Pérez', localidad: 'Carilo', direccion: 'Av. Divisadero 450', telefono: '2254123456' },
      { id: 'CLI-2', nombre: 'Fumigadora del Este', localidad: 'Pinamar', direccion: 'Bunge 1200', telefono: '2254987654' }
    ],
    proveedores: [
      { id: 'PRV-1', nombre: 'Mayorista de Insumos S.A.', rubro: 'Insumos', telefono: '2254445566' },
      { id: 'PRV-2', nombre: 'Combustibles del Tuyú', rubro: 'Combustible', telefono: '2254667788' }
    ],
  };

  /**
   * Genera un respuesta mock cuando API_BASE no está configurada.
   * Permite desarrollar y probar la UI sin backend.
   */
  function _mockResponse(url, options) {
    const urlStr = url || '';
    const isPost = options && options.method === 'POST';

    // Parsear acción
    let action = '';
    if (isPost && options.body) {
      try { action = JSON.parse(options.body).action; } catch { action = ''; }
    } else {
      const params = new URLSearchParams(urlStr.split('?')[1] || '');
      action = params.get('action') || '';
    }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(_handleMockAction(action, { url: urlStr, ...options }));
      }, 600); // Simular latencia de red
    });
  }

  /** Enruta acciones mock al handler correspondiente */
  function _handleMockAction(action, options) {
    switch (action) {
      case 'getDashboard':
        return _mockDashboard(options);
      case 'getHistorial':
        return _mockHistorial();
      case 'getClientes':
        return _mockGetClientes();
      case 'getProveedores':
        return _mockGetProveedores();
      case 'createIngreso':
        return _mockCreateIngreso(options);
      case 'createGasto':
        return _mockCreateGasto(options);
      case 'createCliente':
        return _mockCreateCliente(options);
      case 'createProveedor':
        return _mockCreateProveedor(options);
      case 'login':
        return _mockLogin(options);
      case 'register':
        return _mockRegister(options);
      case 'updateMovimientoAbonado':
        return _mockUpdateMovimientoAbonado(options);
      case 'updateCliente':
        return _mockUpdateCliente(options);
      case 'updateProveedor':
        return _mockUpdateProveedor(options);
      default:
        return { success: false, message: 'Acción no reconocida' };
    }
  }

  function _mockUpdateCliente(options) {
    try {
      const body = JSON.parse(options.body);
      const data = body.data;
      const index = _mockData.clientes.findIndex(c => c.id === data.id);
      if (index !== -1) {
        _mockData.clientes[index] = { ..._mockData.clientes[index], ...data };
        return { success: true, message: 'Cliente actualizado correctamente' };
      }
      return { success: false, message: 'Cliente no encontrado' };
    } catch {
      return { success: false, message: 'Error' };
    }
  }

  function _mockUpdateProveedor(options) {
    try {
      const body = JSON.parse(options.body);
      const data = body.data;
      const index = _mockData.proveedores.findIndex(p => p.id === data.id);
      if (index !== -1) {
        _mockData.proveedores[index] = { ..._mockData.proveedores[index], ...data };
        return { success: true, message: 'Proveedor actualizado correctamente' };
      }
      return { success: false, message: 'Proveedor no encontrado' };
    } catch {
      return { success: false, message: 'Error' };
    }
  }

  function _mockUpdateMovimientoAbonado(options) {
    try {
      const body = JSON.parse(options.body);
      const { id, abonado } = body.data;
      if (id.indexOf('ING-') === 0) {
        const item = _mockData.ingresos.find(i => i.id === id);
        if (item) {
          item.abonado = abonado;
          return { success: true, message: 'Estado actualizado' };
        }
      } else {
        const item = _mockData.gastos.find(g => g.id === id);
        if (item) {
          item.abonado = abonado;
          return { success: true, message: 'Estado actualizado' };
        }
      }
      return { success: false, message: 'No encontrado' };
    } catch {
      return { success: false, message: 'Error' };
    }
  }

  function _mockDashboard(options) {
    let anioFiltro = '';
    let mesFiltro = '';
    
    if (options && options.url) {
      try {
        const urlObj = new URL(options.url, 'http://localhost');
        anioFiltro = urlObj.searchParams.get('anio') || '';
        mesFiltro = urlObj.searchParams.get('mes') || '';
      } catch (e) {
        console.error(e);
      }
    }

    const filterFn = (item) => {
      if (!item.fecha) return true;
      const parts = item.fecha.split('-'); // Format YYYY-MM-DD
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        if (anioFiltro && year !== anioFiltro) return false;
        if (mesFiltro && String(parseInt(month, 10)).padStart(2, '0') !== String(parseInt(mesFiltro, 10)).padStart(2, '0')) return false;
      }
      return true;
    };

    const filteredIngresos = _mockData.ingresos.filter(filterFn);
    const filteredGastos = _mockData.gastos.filter(filterFn);

    const totalIngresos = filteredIngresos.reduce((sum, i) => sum + Number(i.importe), 0);
    const totalGastos = filteredGastos.reduce((sum, g) => sum + Number(g.importe), 0);
    
    const totalCobrado = filteredIngresos.filter(i => i.abonado === 'SI').reduce((sum, i) => sum + Number(i.importe), 0);
    const totalPagado = filteredGastos.filter(g => g.abonado === 'SI' || !g.abonado).reduce((sum, g) => sum + Number(g.importe), 0);

    // Calcular estadísticas agrupadas para los nuevos requerimientos
    const serviciosPorLocalidad = {};
    const ingresosPorLocalidad = {};
    const ingresosPorServicio = {};
    const gastosPorCategoria = {};
    let cantidadServiciosTotal = filteredIngresos.length;

    filteredIngresos.forEach(ing => {
      const loc = ing.localidad || 'Sin Localidad';
      const serv = ing.servicio || 'Sin Servicio';
      const imp = Number(ing.importe) || 0;

      serviciosPorLocalidad[loc] = (serviciosPorLocalidad[loc] || 0) + 1;
      ingresosPorLocalidad[loc] = (ingresosPorLocalidad[loc] || 0) + imp;
      ingresosPorServicio[serv] = (ingresosPorServicio[serv] || 0) + imp;
    });

    filteredGastos.forEach(gas => {
      const cat = gas.categoria || 'Otros';
      const imp = Number(gas.importe) || 0;
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + imp;
    });

    return {
      success: true,
      data: {
        totalIngresos,
        totalGastos,
        saldoNeto: totalCobrado - totalPagado,
        resultadoNeto: totalIngresos - totalGastos,
        serviciosPorLocalidad,
        ingresosPorLocalidad,
        ingresosPorServicio,
        gastosPorCategoria,
        cantidadServiciosTotal,
        filteredIngresos,
        filteredGastos
      },
    };
  }

  function _mockHistorial() {
    const all = [
      ..._mockData.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
      ..._mockData.gastos.map(g => ({ ...g, tipo: 'gasto' })),
    ];
    all.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return { success: true, data: all };
  }

  function _mockGetClientes() {
    return { success: true, data: _mockData.clientes };
  }

  function _mockGetProveedores() {
    return { success: true, data: _mockData.proveedores || [] };
  }

  function _mockCreateIngreso(options) {
    try {
      const body = JSON.parse(options.body);
      const ingreso = {
        ...body.data,
        id: `ING-${Date.now()}`,
      };
      _mockData.ingresos.push(ingreso);
      return { success: true, message: 'Ingreso guardado correctamente', data: ingreso };
    } catch {
      return { success: false, message: 'Error al procesar datos' };
    }
  }

  function _mockCreateGasto(options) {
    try {
      const body = JSON.parse(options.body);
      const gasto = {
        ...body.data,
        id: `GAS-${Date.now()}`,
      };
      _mockData.gastos.push(gasto);
      return { success: true, message: 'Gasto guardado correctamente', data: gasto };
    } catch {
      return { success: false, message: 'Error al procesar datos' };
    }
  }

  function _mockCreateCliente(options) {
    try {
      const body = JSON.parse(options.body);
      const cliente = {
        ...body.data,
        id: `CLI-${Date.now()}`,
      };
      _mockData.clientes.push(cliente);
      return { success: true, message: 'Cliente guardado correctamente', data: cliente };
    } catch {
      return { success: false, message: 'Error al procesar datos' };
    }
  }

  function _mockCreateProveedor(options) {
    try {
      const body = JSON.parse(options.body);
      const prov = {
        ...body.data,
        id: `PRV-${Date.now()}`,
      };
      _mockData.proveedores = _mockData.proveedores || [];
      _mockData.proveedores.push(prov);
      return { success: true, message: 'Proveedor guardado correctamente', data: prov };
    } catch {
      return { success: false, message: 'Error al procesar datos' };
    }
  }

  function _mockLogin(options) {
    try {
      const body = JSON.parse(options.body);
      const email = body.data.email.trim().toLowerCase();
      const password = body.data.password.trim();
      
      _mockData.usuarios = _mockData.usuarios || [{ email: 'admin@aplifumi.com', password: 'admin123' }];
      
      const found = _mockData.usuarios.find(u => u.email === email && u.password === password);
      if (found) {
        return { success: true, message: 'Sesión iniciada' };
      } else {
        return { success: false, message: 'Email o contraseña incorrectos' };
      }
    } catch {
      return { success: false, message: 'Error de servidor mock' };
    }
  }

  function _mockRegister(options) {
    try {
      const body = JSON.parse(options.body);
      const email = body.data.email.trim().toLowerCase();
      const password = body.data.password.trim();
      
      _mockData.usuarios = _mockData.usuarios || [{ email: 'admin@aplifumi.com', password: 'admin123' }];
      
      const exists = _mockData.usuarios.some(u => u.email === email);
      if (exists) {
        return { success: false, message: 'El correo electrónico ya se encuentra registrado' };
      }
      
      _mockData.usuarios.push({ email, password });
      return { success: true, message: 'Usuario registrado con éxito' };
    } catch {
      return { success: false, message: 'Error de servidor mock' };
    }
  }

  /* ─── API Pública ─── */

  /**
   * Obtiene los datos del dashboard (totales y saldo).
   * @param {Object} [filters] — Filtros opcionales { anio, mes }
   * @returns {Promise<Object>} { totalIngresos, totalGastos, saldoNeto, resultadoNeto }
   */
  function getDashboard(filters = {}) {
    return _post('getDashboard', filters);
  }

  /**
   * Obtiene el historial de movimientos.
   * @param {Object} [filters] — Filtros opcionales.
   * @returns {Promise<Object>} Lista de movimientos.
   */
  function getHistorial(filters = {}) {
    return _get('getHistorial', filters);
  }

  /**
   * Obtiene la lista de clientes.
   * @returns {Promise<Object>} Lista de clientes.
   */
  function getClientes() {
    return _get('getClientes');
  }

  /**
   * Crea un nuevo registro de ingreso.
   * @param {Object} data — Datos del ingreso.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  function createIngreso(data) {
    return _post('createIngreso', data);
  }

  /**
   * Crea un nuevo registro de gasto.
   * @param {Object} data — Datos del gasto.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  function createGasto(data) {
    return _post('createGasto', data);
  }

  /**
   * Crea un nuevo registro de cliente.
   * @param {Object} data — Datos del cliente.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  function createCliente(data) {
    return _post('createCliente', data);
  }

  /**
   * Obtiene la lista de proveedores.
   * @returns {Promise<Object>} Lista de proveedores.
   */
  function getProveedores() {
    return _get('getProveedores');
  }

  /**
   * Crea un nuevo registro de proveedor.
   * @param {Object} data — Datos del proveedor.
   * @returns {Promise<Object>} Resultado de la operación.
   */
  function createProveedor(data) {
    return _post('createProveedor', data);
  }

  /**
   * Realiza la validación de credenciales.
   * @param {Object} data — Email y Password.
   * @returns {Promise<Object>} Resultado.
   */
  function login(data) {
    return _post('login', data);
  }

  /**
   * Registra un nuevo usuario.
   * @param {Object} data — Email y Password.
   * @returns {Promise<Object>} Resultado.
   */
  function register(data) {
    return _post('register', data);
  }

  /**
   * Actualiza el estado de abonado (SI/NO).
   * @param {Object} data — { id, abonado }
   * @returns {Promise<Object>}
   */
  function updateMovimientoAbonado(data) {
    return _post('updateMovimientoAbonado', data);
  }

  /**
   * Actualiza un cliente existente.
   * @param {Object} data — { id, nombre, localidad, direccion, telefono }
   * @returns {Promise<Object>}
   */
  function updateCliente(data) {
    return _post('updateCliente', data);
  }

  /**
   * Actualiza un proveedor existente.
   * @param {Object} data — { id, nombre, rubro, telefono }
   * @returns {Promise<Object>}
   */
  function updateProveedor(data) {
    return _post('updateProveedor', data);
  }

  /**
   * Verifica si el backend está configurado.
   * @returns {boolean} True si API_BASE tiene valor.
   */
  function isConfigured() {
    return Boolean(API_BASE);
  }

  return {
    getDashboard,
    getHistorial,
    getClientes,
    getProveedores,
    createIngreso,
    createGasto,
    createCliente,
    createProveedor,
    login,
    register,
    updateMovimientoAbonado,
    updateCliente,
    updateProveedor,
    isConfigured,
  };
})();
