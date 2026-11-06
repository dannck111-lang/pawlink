(() => {
  'use strict';

  const STORAGE = Object.freeze({ user: 'currentUser', loggedIn: 'isLoggedIn', theme: 'pawlinkTheme' });
  const PUBLIC_PAGES = new Set(['index.html', 'login.html', 'signup.html', '']);

  function readUser() {
    try {
      const value = localStorage.getItem(STORAGE.user);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('PawLink could not read the saved user.', error);
      return null;
    }
  }

  const state = {
    get currentUser() { return readUser(); },
    get isLoggedIn() { return localStorage.getItem(STORAGE.loggedIn) === 'true' && Boolean(readUser()); },
    signIn(user) {
      if (!user || typeof user.email !== 'string') throw new TypeError('A user with an email address is required.');
      localStorage.setItem(STORAGE.user, JSON.stringify({ name: user.name || user.email.split('@')[0], email: user.email }));
      localStorage.setItem(STORAGE.loggedIn, 'true');
    },
    signOut() {
      localStorage.removeItem(STORAGE.user);
      localStorage.removeItem(STORAGE.loggedIn);
    }
  };

  function applyTheme(theme) {
    const selected = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = selected;
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      const icon = button.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = selected === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', selected === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = selected === 'dark' ? '#0f172a' : '#f8fafc';
  }

  function initTheme() {
    let saved = 'light';
    try { saved = localStorage.getItem(STORAGE.theme) || 'light'; } catch (error) { /* Theme still works for this page. */ }
    applyTheme(saved);
    document.querySelectorAll('.theme-toggle').forEach((button) => button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(STORAGE.theme, next); } catch (error) { /* Keep the current selection for this page. */ }
    }));
  }

  function guardRoute() {
    const page = window.location.pathname.split('/').pop() || '';
    if (!PUBLIC_PAGES.has(page) && !state.isLoggedIn) {
      window.location.replace('index.html');
      return false;
    }
    return true;
  }

  function initAuthForms() {
    document.querySelectorAll('[data-auth-form]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const email = String(data.get('email') || '').trim();
      const name = String(data.get('name') || '').trim();
      const password = String(data.get('password') || '');
      const error = form.querySelector('[data-form-error]');
      if (error) error.textContent = '';
      if (!email || !password || (form.dataset.authForm === 'signup' && !name)) {
        if (error) error.textContent = 'Please complete all required fields.';
        return;
      }
      // Demo-only local state: replace this with a trusted server-side auth provider before production.
      state.signIn({ name: name || email.split('@')[0], email });
      window.location.assign('dashboard.html');
    }));
  }

  function initAppShell() {
    const user = state.currentUser;
    if (user) {
      document.querySelectorAll('[data-user-name]').forEach((node) => { node.textContent = user.name || user.email; });
      document.querySelectorAll('[data-user-email]').forEach((node) => { node.textContent = user.email; });
      document.querySelectorAll('[data-user-initial]').forEach((node) => { node.textContent = (user.name || user.email).trim().charAt(0).toUpperCase(); });
    }
    document.querySelectorAll('[data-sign-out]').forEach((button) => button.addEventListener('click', () => {
      state.signOut();
      window.location.assign('index.html');
    }));

    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.drawer-backdrop');
    const menuButton = document.querySelector('.menu-toggle');
    const closeMenu = () => {
      sidebar?.classList.remove('is-open');
      backdrop?.classList.remove('is-visible');
      menuButton?.setAttribute('aria-expanded', 'false');
    };
    menuButton?.addEventListener('click', () => {
      const open = !sidebar?.classList.contains('is-open');
      sidebar?.classList.toggle('is-open', open);
      backdrop?.classList.toggle('is-visible', open);
      menuButton.setAttribute('aria-expanded', String(open));
    });
    backdrop?.addEventListener('click', closeMenu);
    sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.querySelectorAll('[data-current-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
    if (!guardRoute()) return;
    initAuthForms();
    initAppShell();
  });

  // Expose the small state API for future vanilla-JS modules.
  window.PawLink = Object.freeze({ state });
})();
