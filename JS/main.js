/* ============================================================
   script.js - Triple Nexo (Completo: i18n + Auth + Validation)
   - Modales accesibles (login/register/confirm)
   - Validaciones avanzadas
   - Integración fetch() para login/register/contact (configurable)
   - i18n con recarga completa (archivos JSON)
   - Manejo de token JWT en localStorage
   - Focus trap, Escape, mobile menu, carrusel
   ============================================================ */
(() => {
  'use strict';

  /* =====================
     CONFIGURACIÓN (AJUSTA ESTO)
     - API_BASE: ruta base de tu API (puede ser vacío para rutas relativas)
     - ENDPOINTS: endpoints para auth y contacto
     - I18N_PATH: carpeta donde alojarás es.json y en.json
     ===================== */
  const API_BASE = '' ; // Ej: 'https://api.tu-dominio.com' o '' para relative
  const ENDPOINTS = {
    LOGIN: '/api/login',        // POST {email,password} -> {token, user}
    REGISTER: '/api/register',  // POST {name,email,password} -> {token,user}
    CONTACT: '/api/contact'     // POST {name,email,organization,message}
  };
  const I18N_PATH = '/i18n'; // colocará /i18n/es.json y /i18n/en.json

  /* =====================
     UTILIDADES DOM
     ===================== */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const safeGet = sel => document.querySelector(sel) || null;
  const noop = () => {};

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isStrongPassword = (v) => {
    // Mínimo 8, 1 mayúscula, 1 minúscula, 1 número. Ajusta si deseas special chars.
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(v);
  };

  const showToast = (msg, opts = {}) => {
    // Mensaje pequeño temporario — si ya tienes un sistema visual puedes integrarlo
    const containerId = '_tn_toast_container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.bottom = '20px';
      container.style.zIndex = 99999;
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.background = opts.background || '#0b5ed7';
    toast.style.color = opts.color || '#fff';
    toast.style.padding = '0.7rem 1rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 6px 18px rgba(11,94,215,0.2)';
    toast.style.marginTop = '0.5rem';
    toast.style.fontWeight = '600';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 300ms';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, opts.duration || 3000);
  };

  /* =====================
     RENDER DINÁMICO / i18n
     - Cambiar idioma recarga el sitio y aplica traducciones desde JSON
     - Archivos esperados: /i18n/es.json y /i18n/en.json
     - Guarda la preferencia en localStorage 'site_lang'
     ===================== */
  const defaultConfig = {
    hero_title: "Juntos transformamos vidas y construimos esperanza",
    hero_subtitle: "Para cada familia que necesita apoyo, cada niño que sueña con un futuro mejor, cada comunidad que busca prosperidad",
    hero_message: "Tu historia de superación comienza aquí. No estás solo en este camino hacia un futuro lleno de oportunidades.",
    mission_title: "Nuestra Esencia",
    services_title: "Nuestros Servicios",
    programs_title: "Programas y Proyectos",
    testimonials_title: "Voces de Esperanza",
    cta_title: "Únete a Nuestra Misión",
    cta_subtitle: "Juntos podemos crear un impacto duradero en las comunidades más necesitadas. Tu apoyo hace la diferencia.",
    contact_title: "Conectemos por un Futuro Mejor",
    beneficiaries_count: "25,000+",
    projects_count: "150+",
    partners_count: "45+",
    experience_years: "12+"
  };

  async function loadTranslations(lang) {
    try {
      const url = `${I18N_PATH}/${lang}.json`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('No translation file');
      const data = await res.json();
      // Merge with defaults
      return { ...defaultConfig, ...data };
    } catch (err) {
      console.warn('i18n load failed for', lang, err);
      return { ...defaultConfig };
    }
  }

  async function applyTranslationsAndRender(lang) {
    const cfg = await loadTranslations(lang);
    render(cfg);
  }

  // Render (actualiza textos del DOM)
  function render(config = {}) {
    const conf = { ...defaultConfig, ...config };
    const setText = (sel, txt) => {
      const el = safeGet(sel);
      if (el) el.textContent = txt;
    };
    setText('#hero-title', conf.hero_title);
    setText('#hero-subtitle', conf.hero_subtitle);
    const heroMsg = safeGet('#hero-message');
    if (heroMsg) {
      const p = heroMsg.querySelector('p');
      if (p) p.textContent = conf.hero_message;
    }
    setText('#mission-title', conf.mission_title);
    setText('#services-title', conf.services_title);
    setText('#programs-title', conf.programs_title);
    setText('#testimonials-title', conf.testimonials_title);
    setText('#cta-title', conf.cta_title);
    setText('#cta-subtitle', conf.cta_subtitle);
    setText('#contact-title', conf.contact_title);
    setText('#beneficiaries-count', conf.beneficiaries_count);
    setText('#projects-count', conf.projects_count);
    setText('#partners-count', conf.partners_count);
    setText('#experience-years', conf.experience_years);
  }

  /* =====================
     INIT: idioma guardado o por defecto
     ===================== */
  const LANG_KEY = 'site_lang';
  const supportedLangs = ['es','en'];
  function currentLang() {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && supportedLangs.includes(stored)) return stored;
    // Detecto por browser
    const nav = (navigator.language || navigator.userLanguage || 'es').slice(0,2);
    return supportedLangs.includes(nav) ? nav : 'es';
  }

  // Si hay idioma en localStorage, carga traducciones; si no, carga default y setea.
  (async function initialI18n() {
    const lang = currentLang();
    await applyTranslationsAndRender(lang);
    // Actualiza botón de idioma si existe
    const btn = safeGet('#langToggle');
    if (btn) btn.textContent = (lang === 'es') ? 'ES / EN' : 'EN / ES';
  })();

  /* =====================
     Cambiar idioma (recargar todo)
     - Cambia localStorage y recarga la página para que todo (incluyendo libs) se re-inicialice
     ===================== */
  (function langSwitcher() {
    const btn = safeGet('#langToggle');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const current = currentLang();
      const next = current === 'es' ? 'en' : 'es';
      localStorage.setItem(LANG_KEY, next);
      // recargar la página para aplicar traducciones globales
      window.location.reload();
    });
  })();

  /* =====================
     Accessibility + Header scroll
     ===================== */
  (function headerAndScroll() {
    const header = safeGet('#header');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 100) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* =====================
     Mobile menu
     ===================== */
  (function mobileMenu() {
    const mobileToggle = safeGet('#mobileToggle');
    const navMenu = safeGet('#navMenu');
    if (!mobileToggle || !navMenu) return;
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
    });
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* =====================
     Carrusel de proyectos
     ===================== */
  (function carousel() {
    const slides = $$('.project-slide');
    const dots = $$('.dot');
    if (!slides.length) return;
    let idx = 0;
    let tid = null;
    const show = i => {
      slides.forEach((s,j) => s.classList.toggle('active', j===i));
      dots.forEach((d,j) => d.classList.toggle('active', j===i));
    };
    const next = () => { idx = (idx + 1) % slides.length; show(idx); };
    const prev = () => { idx = (idx - 1 + slides.length) % slides.length; show(idx); };
    show(idx);
    tid = setInterval(next, 5000);
    const prevBtn = safeGet('.carousel-btn.prev');
    const nextBtn = safeGet('.carousel-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); clearInterval(tid); tid = setInterval(next,5000); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); clearInterval(tid); tid = setInterval(next,5000); });
    dots.forEach((dot,i) => dot.addEventListener('click', () => { idx = i; show(idx); clearInterval(tid); tid = setInterval(next,5000); }));
    const carouselEl = safeGet('.projects-carousel');
    if (carouselEl) {
      carouselEl.addEventListener('mouseenter', () => clearInterval(tid));
      carouselEl.addEventListener('mouseleave', () => tid = setInterval(next,5000));
    }
  })();

  /* =====================
     Animations on view (IntersectionObserver)
     ===================== */
  (function animateOnView() {
    const nodes = $$('.program-card, .about-content, .about-visual, .indicator-item, .value-item, .testimonial-card');
    if (!nodes.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('fade-in'); o.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach(n => obs.observe(n));
  })();

  /* =====================
     Modales accesibles: openModal / closeModal / focus trap
     ===================== */
  (function modalsCore() {
    const modals = $$('.modal');
    if (!modals.length) return;

    function trapFocus(modal, e) {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])'))
        .filter(x => !x.hasAttribute('disabled') && x.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length -1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openModal(modal) {
      if (!modal) return;
      modal.classList.add('active');
      modal._lastFocus = document.activeElement;
      const focusable = modal.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
      document.documentElement.style.overflow = 'hidden';
      modal.addEventListener('keydown', trapFocusHandler);
      document.addEventListener('keydown', escHandler);
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('active');
      document.documentElement.style.overflow = '';
      try { if (modal._lastFocus) modal._lastFocus.focus(); } catch(e){}
      modal.removeEventListener('keydown', trapFocusHandler);
      document.removeEventListener('keydown', escHandler);
    }

    function escHandler(e) { if (e.key === 'Escape') { const active = document.querySelector('.modal.active'); if (active) closeModal(active); } }
    function trapFocusHandler(e) { trapFocus(e.currentTarget, e); }

    // Openers
    const loginOpeners = [ safeGet('#openLoginModal'), safeGet('#loginBtn') ].filter(Boolean);
    const registerOpeners = [ safeGet('#openRegisterModal'), safeGet('#registerBtn') ].filter(Boolean);
    const loginModal = safeGet('#loginModal');
    const registerModal = safeGet('#registerModal');

    loginOpeners.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(loginModal); }));
    registerOpeners.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openModal(registerModal); }));

    // Close buttons
    $$('.close-btn, [data-close]').forEach(btn => btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) closeModal(modal);
    }));

    // Click outside
    modals.forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m); }));

    // Expose open/close globally (opcional)
    window.openModal = openModal;
    window.closeModal = closeModal;
  })();

  /* =====================
     Formularios & API integration (login/register/contact)
     ===================== */
  (function formsAndAuth() {

    // Helper fetch wrapper
    async function apiPost(path, body) {
      const url = (API_BASE || '') + path;
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, body: json };
    }

    // LOGIN
    const loginForm = safeGet('#loginModal .modal-form') || safeGet('#loginModal form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]')?.value?.trim() || '';
        const password = loginForm.querySelector('input[type="password"]')?.value || '';
        const submitBtn = loginForm.querySelector('button[type="submit"], .btn-primary');

        if (!isEmail(email)) {
          showToast('Correo inválido', { background:'#e11d48' });
          return;
        }
        if (!password) {
          showToast('Ingresa tu contraseña', { background:'#e11d48' });
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Entrando...'; }
        try {
          const { status, ok, body } = await apiPost(ENDPOINTS.LOGIN, { email, password });
          if (ok && body.token) {
            localStorage.setItem('auth_token', body.token);
            showToast('Bienvenido/a', { background:'#10b981' });
            // cerrar modal
            const modal = safeGet('#loginModal'); if (modal) modal.classList.remove('active');
            // opcional: actualizar UI (mostrar nombre, botón logout)
            if (body.user && body.user.name) showToast(`Hola ${body.user.name}`, { background:'#10b981' });
          } else {
            const msg = (body && (body.message || body.error)) || 'Error en autenticación';
            showToast(msg, { background:'#e11d48' });
          }
        } catch (err) {
          showToast('Error de red', { background:'#e11d48' });
          console.error(err);
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Entrar'; }
        }
      });
    }

    // REGISTER
    const registerForm = safeGet('#registerModal .modal-form') || safeGet('#registerModal form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('input[type="text"], input[name="name"]')?.value?.trim() || '';
        const email = registerForm.querySelector('input[type="email"]')?.value?.trim() || '';
        const password = registerForm.querySelector('input[type="password"]')?.value || '';
        const submitBtn = registerForm.querySelector('button[type="submit"], .btn-primary');

        if (!name) { showToast('Ingresa tu nombre', { background:'#e11d48' }); return; }
        if (!isEmail(email)) { showToast('Correo inválido', { background:'#e11d48' }); return; }
        if (!isStrongPassword(password)) {
          showToast('Contraseña débil. Mín 8 chars, 1 mayúscula, 1 minúscula y 1 número.', { background:'#e11d48' });
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creando cuenta...'; }
        try {
          const { ok, body } = await apiPost(ENDPOINTS.REGISTER, { name, email, password });
          if (ok && body.token) {
            localStorage.setItem('auth_token', body.token);
            showToast('Cuenta creada', { background:'#10b981' });
            const modal = safeGet('#registerModal'); if (modal) modal.classList.remove('active');
          } else {
            const msg = (body && (body.message || body.error)) || 'Error en registro';
            showToast(msg, { background:'#e11d48' });
          }
        } catch (err) {
          showToast('Error de red', { background:'#e11d48' });
          console.error(err);
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Registrarme'; }
        }
      });
    }

    // CONTACT
    const contactForm = safeGet('#contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = safeGet('#submitBtn');
        const name = contactForm.querySelector('[name="name"]')?.value?.trim() || '';
        const email = contactForm.querySelector('[name="email"]')?.value?.trim() || '';
        const organization = contactForm.querySelector('[name="organization"]')?.value?.trim() || '';
        const message = contactForm.querySelector('[name="message"]')?.value?.trim() || '';

        if (!name || !email || !message) {
          const fm = safeGet('#formMessage');
          if (fm) fm.innerHTML = '<div class="success-message" style="background:#ffe6e6;color:#7a1a1a;border:1px solid #f5c2c2;">Por favor completa los campos requeridos.</div>';
          return;
        }
        if (!isEmail(email)) {
          const fm = safeGet('#formMessage');
          if (fm) fm.innerHTML = '<div class="success-message" style="background:#ffe6e6;color:#7a1a1a;border:1px solid #f5c2c2;">Correo inválido.</div>';
          return;
        }

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }
        try {
          const { ok, body } = await apiPost(ENDPOINTS.CONTACT, { name, email, organization, message });
          if (ok) {
            // mostrar modal confirm
            const confirmModal = safeGet('#confirmModal');
            if (confirmModal) confirmModal.classList.add('active');
            contactForm.reset();
            const fm = safeGet('#formMessage');
            if (fm) fm.innerHTML = '<div class="success-message">Gracias — tu mensaje fue enviado correctamente.</div>';
          } else {
            const fm = safeGet('#formMessage');
            if (fm) fm.innerHTML = `<div class="success-message" style="background:#ffe6e6;color:#7a1a1a;border:1px solid #f5c2c2;">${(body && (body.message || body.error)) || 'Error al enviar el mensaje'}</div>`;
          }
        } catch (err) {
          console.error(err);
          showToast('Error de red', { background:'#e11d48' });
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar Mensaje'; }
        }
      });
    }
  })();

  /* =====================
     Confirm modal handlers (cerrar)
     ===================== */
  (function confirmModal() {
    const confirmModal = safeGet('#confirmModal');
    if (!confirmModal) return;
    const modalClose = safeGet('#modalClose');
    if (modalClose) modalClose.addEventListener('click', () => confirmModal.classList.remove('active'));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.classList.remove('active'); });
  })();

  /* =====================
     Intersection observer for lazy animations (already above)
     ===================== */
  document.addEventListener('DOMContentLoaded', () => {
    // Reaplicar render (ya hace initial i18n)
    // Inicia observers y demás si es necesario (las IIFE ya lo hicieron)
  });

  /* =====================
     Export pequeño para debug (opcional)
     ===================== */
  window.TripleNexo = {
    API_BASE,
    ENDPOINTS,
    I18N_PATH,
    setLang: (lang) => { if (supportedLangs.includes(lang)) { localStorage.setItem(LANG_KEY, lang); window.location.reload(); } }
  };

})();
