(() => {
  'use strict';

  const KEYS = { user: 'currentUser', loggedIn: 'isLoggedIn', theme: 'pawlinkTheme' };
  const PUBLIC_PAGES = new Set(['', 'index.html', 'login.html', 'signup.html']);
  const pets = [
    { id: 'milo', name: 'Milo', species: 'Dog', breed: 'Golden Retriever mix', age: '2 years', location: 'Oakland, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80', description: 'A gentle, sunny-natured companion who loves walks and new friends.' },
    { id: 'luna', name: 'Luna', species: 'Cat', breed: 'Domestic shorthair', age: '1 year', location: 'Berkeley, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80', description: 'Curious, affectionate, and happiest in a cozy sunny window.' },
    { id: 'buddy', name: 'Buddy', species: 'Dog', breed: 'Beagle mix', age: '4 years', location: 'San Francisco, CA', category: 'Adoption', status: 'Foster favorite', image: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=800&q=80', description: 'A friendly little explorer with a big heart and a great nose.' },
    { id: 'peaches', name: 'Peaches', species: 'Cat', breed: 'Calico', age: '3 years', location: 'Richmond, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', description: 'A mellow, people-loving cat who enjoys company and gentle play.' },
    { id: 'max', name: 'Max', species: 'Dog', breed: 'Terrier mix', age: '8 months', location: 'Alameda, CA', category: 'Adoption', status: 'New arrival', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80', description: 'Playful puppy energy, learning new things every day.' },
    { id: 'coco', name: 'Coco', species: 'Dog', breed: 'Poodle mix', age: '5 years', location: 'Emeryville, CA', category: 'Adoption', status: 'Ready to meet', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80', description: 'A smart, sweet companion looking for a calm forever home.' }
  ];

  function readUser() {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
    catch (error) { return null; }
  }
  const state = {
    get currentUser() { return readUser(); },
    get isLoggedIn() {
      try { return localStorage.getItem(KEYS.loggedIn) === 'true' && Boolean(readUser()); }
      catch (error) { return false; }
    },
    saveUser(user) {
      if (!user || !user.email) throw new TypeError('An email address is required.');
      const saved = { ...(readUser() || {}), ...user };
      localStorage.setItem(KEYS.user, JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('pawlink:userchange', { detail: saved }));
      return saved;
    },
    signOut() {
      localStorage.removeItem(KEYS.user);
      localStorage.removeItem(KEYS.loggedIn);
      window.location.assign('index.html');
    }
  };

  function applyTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.querySelectorAll('.theme-toggle [data-theme-icon]').forEach((icon) => { icon.textContent = value === 'dark' ? '☀' : '☾'; });
    document.querySelectorAll('.theme-toggle').forEach((button) => button.setAttribute('aria-label', value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = value === 'dark' ? '#0f172a' : '#f8fafc';
  }

  function initTheme() {
    try { applyTheme(localStorage.getItem(KEYS.theme) || 'light'); } catch (error) { applyTheme('light'); }
    document.querySelectorAll('.theme-toggle').forEach((button) => button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(KEYS.theme, next); } catch (error) { /* Theme remains applied for this session. */ }
    }));
  }

  function guardRoute() {
    const page = location.pathname.split('/').pop() || '';
    if (!PUBLIC_PAGES.has(page) && !state.isLoggedIn) {
      location.replace('index.html');
      return false;
    }
    return true;
  }

  function toast(message) {
    let node = document.querySelector('[data-toast]');
    if (!node) {
      node = document.createElement('div');
      node.className = 'paw-toast';
      node.dataset.toast = '';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.append(node);
    }
    node.textContent = message;
    node.classList.add('is-visible');
    window.setTimeout(() => node.classList.remove('is-visible'), 3500);
  }

  function syncUser(user = state.currentUser) {
    if (!user) return;
    document.querySelectorAll('[data-user-name]').forEach((node) => { node.textContent = user.name || user.email || 'Pet lover'; });
    document.querySelectorAll('[data-user-email]').forEach((node) => { node.textContent = user.email || ''; });
    document.querySelectorAll('[data-user-initial]').forEach((node) => { node.textContent = (user.name || user.email || 'P').trim().charAt(0).toUpperCase(); });
  }

  function initAuth() {
    document.querySelectorAll('[data-auth-form]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const error = form.querySelector('[data-form-error]');
      const email = String(data.get('email') || '').trim();
      const password = String(data.get('password') || '');
      if (error) error.textContent = '';
      if (!email || password.length < 8) {
        if (error) error.textContent = 'Enter a valid email and a password of at least 8 characters.';
        return;
      }
      if (form.dataset.authForm === 'signup') {
        const user = {};
        for (const [key, value] of data.entries()) if (key !== 'password') user[key] = String(value).trim();
        user.name = user.name || email.split('@')[0];
        try {
          state.saveUser(user);
          localStorage.setItem(KEYS.loggedIn, 'true');
          toast('Welcome to PawLink! Every little action helps a pet find their way home.');
          window.setTimeout(() => location.assign('dashboard.html'), 700);
        } catch (storageError) {
          if (error) error.textContent = 'Unable to save your account in this browser.';
        }
      } else {
        state.saveUser({ name: String(data.get('name') || email.split('@')[0]), email });
        localStorage.setItem(KEYS.loggedIn, 'true');
        location.assign('dashboard.html');
      }
    }));
  }

  function petCard(pet, featured = false) {
    return `<article class="pet-card${featured ? ' featured-pet-card' : ''}" data-pet-card data-species="${pet.species.toLowerCase()}" data-category="${pet.category.toLowerCase()}" data-location="${pet.location.toLowerCase()}">
      <a class="pet-photo" href="adopt.html" aria-label="Learn about ${pet.name}"><img src="${pet.image}" alt="${pet.name}, a ${pet.breed}" loading="lazy"><span class="pet-status">${pet.status}</span></a>
      <div class="pet-card-body"><div class="pet-title-row"><div><h3>${pet.name}</h3><p>${pet.breed}</p></div><span class="pet-heart" aria-hidden="true">♡</span></div>
      <div class="pet-meta"><span>${pet.age}</span><span>${pet.location}</span></div>
      ${featured ? `<a class="pet-link" href="adopt.html">Meet ${pet.name} <span aria-hidden="true">→</span></a>` : `<button class="button button-primary pet-inquire" type="button" data-inquire="${pet.id}">Ask about ${pet.name}</button>`}</div>
    </article>`;
  }

  function initPetCards() {
    document.querySelectorAll('[data-featured-pets]').forEach((container) => { container.innerHTML = pets.slice(0, 4).map((pet) => petCard(pet, true)).join(''); });
    const grid = document.querySelector('[data-pet-grid]');
    if (grid) {
      grid.innerHTML = pets.map((pet) => petCard(pet)).join('');
      const search = document.querySelector('[data-search-input]');
      const category = document.querySelector('[data-filter-category]');
      const locationFilter = document.querySelector('[data-filter-location]');
      const species = document.querySelector('[data-filter-species]');
      const chips = [...document.querySelectorAll('[data-category-chip]')];
      let chipCategory = 'all';
      const filter = () => {
        const term = (search?.value || '').trim().toLowerCase();
        const categoryValue = category?.value || chipCategory;
        let count = 0;
        grid.querySelectorAll('[data-pet-card]').forEach((card, index) => {
          const pet = pets[index];
          const matches = (!term || `${pet.name} ${pet.breed} ${pet.species} ${pet.location} ${pet.description}`.toLowerCase().includes(term)) && (categoryValue === 'all' || pet.category.toLowerCase() === categoryValue) && (!locationFilter?.value || pet.location.toLowerCase().includes(locationFilter.value.toLowerCase())) && (!species?.value || pet.species.toLowerCase() === species.value);
          card.hidden = !matches;
          if (matches) count += 1;
        });
        const result = document.querySelector('[data-search-count]');
        if (result) result.textContent = `${count} ${count === 1 ? 'pet' : 'pets'} found`;
        const empty = document.querySelector('[data-no-results]');
        if (empty) empty.hidden = count > 0;
      };
      [search, category, locationFilter, species].filter(Boolean).forEach((control) => control.addEventListener('input', filter));
      chips.forEach((chip) => chip.addEventListener('click', () => {
        chipCategory = chip.dataset.categoryChip;
        chips.forEach((item) => item.classList.toggle('is-active', item === chip));
        if (category) category.value = chipCategory;
        filter();
      }));
      filter();
    }
  }

  function initInquiryModal() {
    const dialog = document.querySelector('[data-inquiry-dialog]');
    if (!dialog) return;
    const form = dialog.querySelector('form');
    const user = state.currentUser || {};
    ['applicantName', 'applicantEmail', 'applicantPhone'].forEach((key) => {
      const input = form.elements.namedItem(key);
      if (input) input.value = key === 'applicantName' ? (user.name || '') : key === 'applicantEmail' ? (user.email || '') : (user.phone || '');
    });
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-inquire]');
      if (!trigger) return;
      const pet = pets.find((item) => item.id === trigger.dataset.inquire);
      if (pet) {
        dialog.querySelector('[data-modal-pet]').textContent = pet.name;
        dialog.querySelector('[name="petName"]').value = pet.name;
        dialog.showModal();
      }
    });
    dialog.querySelectorAll('[data-modal-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      dialog.close();
      toast(`Thanks! Your inquiry for ${form.elements.namedItem('petName').value} is ready for the PawLink team.`);
      form.reset();
      const current = state.currentUser || {};
      form.elements.namedItem('applicantName').value = current.name || '';
      form.elements.namedItem('applicantEmail').value = current.email || '';
      form.elements.namedItem('applicantPhone').value = current.phone || '';
    });
  }

  function initShell() {
    syncUser();
    document.addEventListener('pawlink:userchange', (event) => syncUser(event.detail));
    window.addEventListener('storage', (event) => { if (event.key === KEYS.user) syncUser(); });
    document.querySelectorAll('[data-sign-out]').forEach((button) => button.addEventListener('click', () => state.signOut()));
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.drawer-backdrop');
    const toggle = document.querySelector('.menu-toggle');
    const close = () => { sidebar?.classList.remove('is-open'); backdrop?.classList.remove('is-visible'); toggle?.setAttribute('aria-expanded', 'false'); };
    toggle?.addEventListener('click', () => {
      const open = !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', open);
      backdrop?.classList.toggle('is-visible', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    backdrop?.addEventListener('click', close);
    sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (!guardRoute()) return;
    initAuth();
    initShell();
    initPetCards();
    initInquiryModal();
  });
  window.PawLink = Object.freeze({ state, pets: Object.freeze(pets) });
})();
