/* ============================================
   APLIFUMI — Módulo de Autenticación
   Formulario de login, registro y persistencia de sesión
   ============================================ */

/**
 * Módulo de Login.
 * Gestiona el acceso restringido, registro de cuenta y persistencia de sesión.
 */
const Login = (() => {
  'use strict';

  const STORAGE_KEY = 'aplifumi-session';

  /** HTML de la pantalla completa de login y registro */
  function render() {
    return `
      <div id="login-screen" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950 animate-fade-in">
        <!-- Contenedor principal de Login -->
        <div id="login-container" class="glass-card w-full max-w-sm p-6 space-y-6 bg-slate-900 border-slate-800 shadow-2xl">
          <!-- Logo & Título -->
          <div class="flex flex-col items-center gap-2 text-center">
            <div class="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg bg-white">
              <img src="logo.jpg" alt="Raggio Fumigaciones Logo" class="w-full h-full object-cover">
            </div>
            <h1 class="text-xl font-bold text-white tracking-tight mt-2">Acceso a Aplifumi</h1>
            <p class="text-xs text-slate-400">Ingresa tus credenciales para continuar</p>
          </div>

          <!-- Formulario Login -->
          <form id="form-login" class="space-y-4" novalidate>
            <div>
              <label for="login-email" class="form-label text-slate-400">Email *</label>
              <input type="email" id="login-email" name="email" class="form-input bg-slate-800 border-slate-700 text-white placeholder-slate-500" placeholder="usuario@aplifumi.com" required autocomplete="username">
            </div>

            <div>
              <label for="login-password" class="form-label text-slate-400">Contraseña *</label>
              <input type="password" id="login-password" name="password" class="form-input bg-slate-800 border-slate-700 text-white placeholder-slate-500" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <!-- Mantener sesión iniciada -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="login-remember" name="remember" class="w-4.5 h-4.5 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-600 focus:ring-offset-slate-900">
                <label for="login-remember" class="text-xs font-semibold text-slate-300 select-none cursor-pointer">Mantener sesión iniciada</label>
              </div>
            </div>

            <!-- Botón ingresar -->
            <button type="submit" id="btn-login" class="btn-primary w-full mt-2">
              Ingresar
            </button>
          </form>

          <div class="text-center pt-2">
            <button id="btn-goto-register" class="text-xs text-violet-400 hover:text-violet-300 font-semibold focus:outline-none">
              ¿No tienes una cuenta? Crear cuenta
            </button>
          </div>
        </div>

        <!-- Contenedor principal de Registro (Oculto inicialmente) -->
        <div id="register-container" class="glass-card w-full max-w-sm p-6 space-y-6 bg-slate-900 border-slate-800 shadow-2xl hidden">
          <!-- Logo & Título -->
          <div class="flex flex-col items-center gap-2 text-center">
            <div class="w-12 h-12 rounded-2xl gradient-income flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-white tracking-tight mt-2">Crear Cuenta</h1>
            <p class="text-xs text-slate-400">Registra un nuevo usuario administrador</p>
          </div>

          <!-- Formulario Registro -->
          <form id="form-register" class="space-y-4" novalidate>
            <div>
              <label for="register-email" class="form-label text-slate-400">Email *</label>
              <input type="email" id="register-email" name="email" class="form-input bg-slate-800 border-slate-700 text-white placeholder-slate-500" placeholder="usuario@aplifumi.com" required autocomplete="username">
            </div>

            <div>
              <label for="register-password" class="form-label text-slate-400">Contraseña *</label>
              <input type="password" id="register-password" name="password" class="form-input bg-slate-800 border-slate-700 text-white placeholder-slate-500" placeholder="Mínimo 6 caracteres" required autocomplete="new-password">
            </div>

            <!-- Botón registrar -->
            <button type="submit" id="btn-register" class="btn-primary w-full mt-2" style="background: linear-gradient(135deg, var(--color-income), #059669);">
              Registrar cuenta
            </button>
          </form>

          <div class="text-center pt-2">
            <button id="btn-goto-login" class="text-xs text-violet-400 hover:text-violet-300 font-semibold focus:outline-none">
              ¿Ya tienes una cuenta? Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', _handleSubmitLogin);
    }

    const formRegister = document.getElementById('form-register');
    if (formRegister) {
      formRegister.addEventListener('submit', _handleSubmitRegister);
    }

    // Toggle views
    const gotoRegister = document.getElementById('btn-goto-register');
    if (gotoRegister) {
      gotoRegister.addEventListener('click', () => _switchContainer(true));
    }

    const gotoLogin = document.getElementById('btn-goto-login');
    if (gotoLogin) {
      gotoLogin.addEventListener('click', () => _switchContainer(false));
    }
  }

  /** Cambia entre el formulario de login y el de registro */
  function _switchContainer(showRegister) {
    const loginCont = document.getElementById('login-container');
    const registerCont = document.getElementById('register-container');

    if (showRegister) {
      loginCont.classList.add('hidden');
      registerCont.classList.remove('hidden');
      registerCont.classList.add('animate-fade-in');
    } else {
      registerCont.classList.add('hidden');
      loginCont.classList.remove('hidden');
      loginCont.classList.add('animate-fade-in');
    }
  }

  /** Maneja el submit de login */
  async function _handleSubmitLogin(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById('btn-login');
    const data = FormHelper.getFormData(form);

    if (!data.email || !data.password) {
      Toast.show('Por favor, ingresa correo y contraseña', 'error');
      return;
    }

    FormHelper.disableSubmit(btn);

    try {
      const response = await Api.login(data);
      if (!response.success) {
        throw new Error(response.message || 'Credenciales incorrectas');
      }

      Toast.show('✅ Sesión iniciada', 'success');

      const remember = document.getElementById('login-remember').checked;
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: data.email, timestamp: Date.now() }));
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: data.email, timestamp: Date.now() }));
      }

      document.getElementById('login-screen').remove();
      App.initAuthenticated();

    } catch (e) {
      Toast.show(e.message || 'Error de conexión', 'error');
      FormHelper.enableSubmit(btn, 'Ingresar');
    }
  }

  /** Maneja el submit de registro */
  async function _handleSubmitRegister(event) {
    event.preventDefault();
    const form = event.target;
    const btn = document.getElementById('btn-register');
    const data = FormHelper.getFormData(form);

    if (!data.email || !data.password) {
      Toast.show('Todos los campos son obligatorios', 'error');
      return;
    }

    if (data.password.length < 6) {
      Toast.show('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    FormHelper.disableSubmit(btn);

    try {
      const response = await Api.register(data);
      if (!response.success) {
        throw new Error(response.message || 'Error al registrar cuenta');
      }

      Toast.show('✅ Registro exitoso. Iniciando sesión...', 'success');
      
      // Auto login tras registro
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: data.email, timestamp: Date.now() }));

      document.getElementById('login-screen').remove();
      App.initAuthenticated();

    } catch (e) {
      Toast.show(e.message || 'Error al registrar cuenta', 'error');
      FormHelper.enableSubmit(btn, 'Registrar cuenta');
    }
  }

  /** Verifica si existe una sesión válida guardada */
  function checkSession() {
    const local = localStorage.getItem(STORAGE_KEY);
    const session = sessionStorage.getItem(STORAGE_KEY);
    return local || session;
  }

  /** Cierra la sesión activa */
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  return { render, init, checkSession, logout };
})();
