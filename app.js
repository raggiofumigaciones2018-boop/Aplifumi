/* ============================================
   APLIFUMI — Módulo Principal (App)
   Router SPA, estado global, tema, inicialización
   ============================================ */

/**
 * Módulo principal de la aplicación.
 * Controla navegación SPA (hash-based), tema claro/oscuro y ciclo de vida de vistas.
 */
const App = (() => {
  'use strict';

  /* ─── Registro de Vistas ─── */

  /** Mapa de rutas a módulos de vista */
  const ROUTES = {
    dashboard:    Dashboard,
    clientes:     Clientes,
    ctacte:       CtaCte,
    proveedores:  Proveedores,
    ingresos:     Ingresos,
    gastos:       Gastos,
    historial:    Historial,
  };

  /** Vista activa actualmente */
  let _currentView = null;
  let _currentRoute = '';

  /* ─── Navegación ─── */

  /**
   * Navega a una vista específica.
   * Destruye la vista anterior, renderiza la nueva y la inicializa.
   * @param {string} route — Nombre de la ruta (e.g., 'dashboard').
   */
  function navigate(route) {
    // Normalizar ruta
    const normalizedRoute = route.replace('#', '').toLowerCase() || 'dashboard';

    // No re-renderizar si ya estamos en la misma vista
    if (normalizedRoute === _currentRoute) return;

    const view = ROUTES[normalizedRoute];
    if (!view) {
      navigate('dashboard');
      return;
    }

    // Destruir vista anterior
    if (_currentView && typeof _currentView.destroy === 'function') {
      _currentView.destroy();
    }

    // Renderizar nueva vista
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = view.render();
    _currentView = view;
    _currentRoute = normalizedRoute;

    // Inicializar la vista (async, no bloquea)
    if (typeof view.init === 'function') {
      view.init();
    }

    // Actualizar navegación activa
    _updateActiveNav(normalizedRoute);

    // Actualizar hash sin disparar evento
    if (window.location.hash !== `#${normalizedRoute}`) {
      history.replaceState(null, '', `#${normalizedRoute}`);
    }

    // Scroll al tope
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Actualiza el estado visual de la barra de navegación inferior */
  function _updateActiveNav(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemRoute = item.dataset.route;
      if (itemRoute === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /* ─── Tema Claro/Oscuro ─── */

  /** Clave de localStorage para persistencia del tema */
  const THEME_KEY = 'aplifumi-theme';

  /** Inicializa el tema desde localStorage o usa oscuro por defecto */
  function _initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || 'dark';
    _applyTheme(theme);
  }

  /**
   * Aplica un tema y actualiza el ícono del toggle.
   * @param {'dark'|'light'} theme — Tema a aplicar.
   */
  function _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Actualizar ícono del toggle
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark'
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>';
    }
  }

  /** Alterna entre tema claro y oscuro */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    _applyTheme(next);

    // Si estamos en estadísticas, re-renderizar gráficos con nuevos colores
    if (_currentRoute === 'estadisticas' && _currentView) {
      _currentView.destroy();
      _currentView.init();
    }
  }

  /* ─── Inicialización ─── */

  /** Inicializa toda la aplicación */
  function init() {
    // 1. Inicializar tema
    _initTheme();

    // 2. Verificar autenticación
    if (!Login.checkSession()) {
      // Mostrar pantalla de login en el body
      const loginWrapper = document.createElement('div');
      loginWrapper.innerHTML = Login.render();
      document.body.appendChild(loginWrapper.firstElementChild);
      Login.init();
      return;
    }

    initAuthenticated();
  }

  /** Inicialización cuando la sesión ya está validada */
  function initAuthenticated() {
    // 1. Vincular eventos de navegación
    _bindNavigation();

    // 2. Navegar a la ruta inicial (hash actual o dashboard)
    const initialRoute = window.location.hash.replace('#', '') || 'dashboard';
    navigate(initialRoute);
  }

  /** Vincula eventos de navegación */
  function _bindNavigation() {
    // Click en items de navegación inferior
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.dataset.route;
        if (route) navigate(route);
      });
    });

    // Hash change (botón atrás/adelante del navegador)
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.replace('#', '') || 'dashboard';
      navigate(route);
    });

    // Toggle tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  /* ─── API Pública ─── */

  return {
    init,
    initAuthenticated,
    navigate,
    toggleTheme,
  };
})();

/* ─── Auto-Inicialización ─── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
