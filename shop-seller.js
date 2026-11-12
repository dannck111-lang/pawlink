(() => {
  'use strict';
  const KEY = 'pawlinkProducts';
  const SESSION_KEY = 'pawlinkSessionListings';
  const readArray = (key) => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const readSession = () => {
    try { const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const currentUser = () => {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null') || {}; }
    catch { return {}; }
  };
  const canEdit = (product) => Boolean(product && currentUser().id && product.sellerId === currentUser().id && product.sellerId !== 'pawlink-shop');
  const safeURL = (value) => /^(https:\/\/|data:image\/(png|jpeg|jpg|webp|gif);base64,)/i.test(String(value || '').trim()) ? String(value).trim() : '';

  function announceProductsChanged() {
    // app.js listens for this event to redraw the marketplace and seller panel.
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  }
  function sessionProducts() {
    return readArray(KEY).filter((product) => product.sellerId !== 'pawlink-shop').concat(readSession());
  }
  function saveSessionProducts(products) {
    const baseProducts = readArray(KEY).filter((product) => product.sellerId === 'pawlink-shop');
    // Keep temporary listings visible to the existing shop renderer only for this tab session.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(products));
    localStorage.setItem(KEY, JSON.stringify([...baseProducts, ...products]));
    announceProductsChanged();
  }
  function removeSessionListings() {
    try {
      const products = readArray(KEY).filter((product) => product.sellerId === 'pawlink-shop');
      localStorage.setItem(KEY, JSON.stringify(products));
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('pawlinkSessionListingActive');
    } catch { /* Leave storage untouched if the browser blocks storage access. */ }
  }

  function init() {
    const dialog = document.querySelector('[data-product-dialog]');
    const form = dialog?.querySelector('.listing-form');
    const rows = document.querySelector('[data-seller-listings]');
    if (!dialog || !form || !rows) return;

    const error = form.querySelector('[data-form-error]');
    const upload = form.elements.namedItem('imageFile');
    const preview = form.querySelector('[data-product-preview]');
    let uploadedImage = '';
    let products = readSession();

    // Pick up custom listings saved by an earlier version so they can be managed now.
    // Preset marketplace products (including Good Dog Training Bites) remain permanent.
    const stored = readArray(KEY);
    const legacyCustom = stored.filter((product) => product.sellerId !== 'pawlink-shop');
    if (!products.length && legacyCustom.length) products = legacyCustom;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(products));
      localStorage.setItem(KEY, JSON.stringify([...stored.filter((product) => product.sellerId === 'pawlink-shop'), ...products]));
      sessionStorage.setItem('pawlinkSessionListingActive', 'true');
    } catch { /* The form will show a storage error if changes cannot be saved. */ }
    announceProductsChanged();

    const showPreview = (src) => {
      if (!preview) return;
      preview.replaceChildren();
      if (!src) return;
      const image = document.createElement('img');
      image.src = src;
      image.alt = 'Product image preview';
      preview.append(image);
    };
    const open = (product = null) => {
      form.reset();
      error.textContent = '';
      uploadedImage = '';
      form.elements.namedItem('productId').value = product?.id || '';
      ['name', 'description', 'price', 'category'].forEach((key) => {
        const field = form.elements.namedItem(key);
        if (field) field.value = product?.[key] ?? (key === 'category' ? 'Toys' : '');
      });
      const urlField = form.elements.namedItem('image');
      if (urlField) urlField.value = product?.image?.startsWith('data:') ? '' : product?.image || '';
      showPreview(product?.image || '');
      dialog.querySelector('#product-modal-title').textContent = product ? 'Edit your listing' : 'List a new item';
      dialog.querySelector('[data-save-product]').textContent = product ? 'Save changes' : 'Publish listing';
      if (!dialog.open) dialog.showModal();
    };

    upload?.addEventListener('change', () => {
      const file = upload.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 400 * 1024) {
        upload.value = '';
        error.textContent = 'Choose an image smaller than 400 KB.';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { uploadedImage = String(reader.result || ''); showPreview(uploadedImage); error.textContent = ''; };
      reader.onerror = () => { error.textContent = 'Could not read that image. Please try another.'; };
      reader.readAsDataURL(file);
    });

    document.addEventListener('click', (event) => {
      const add = event.target.closest('[data-open-product]');
      const edit = event.target.closest('[data-edit-product]');
      const remove = event.target.closest('[data-delete-product]');
      const close = event.target.closest('[data-close-product]');
      if (add) { event.preventDefault(); event.stopImmediatePropagation(); open(); return; }
      if (edit) {
        event.preventDefault(); event.stopImmediatePropagation();
        const product = products.find((item) => item.id === edit.dataset.editProduct);
        if (canEdit(product)) open(product);
        return;
      }
      if (remove) {
        event.preventDefault(); event.stopImmediatePropagation();
        const product = products.find((item) => item.id === remove.dataset.deleteProduct);
        if (!canEdit(product)) return;
        if (!window.confirm(`Delist “${product.name}” for now? It will be removed when you leave this shop session.`)) return;
        products = products.filter((item) => item.id !== product.id);
        try { saveSessionProducts(products); }
        catch { window.alert('Could not delist this item. Please try again.'); }
        return;
      }
      if (close) { event.preventDefault(); event.stopImmediatePropagation(); dialog.close(); }
    }, true);

    document.addEventListener('submit', (event) => {
      if (event.target !== form) return;
      event.preventDefault(); event.stopImmediatePropagation();
      error.textContent = '';
      const data = new FormData(form);
      const id = String(data.get('productId') || '');
      const existing = id ? products.find((item) => item.id === id) : null;
      if (existing && !canEdit(existing)) { error.textContent = 'You can only edit your own listings.'; return; }
      const name = String(data.get('name') || '').trim();
      const description = String(data.get('description') || '').trim();
      const price = Number(data.get('price'));
      if (!name || !description || !Number.isFinite(price) || price <= 0) { error.textContent = 'Enter a name, description, and valid price.'; return; }
      const user = currentUser();
      const imageField = String(data.get('image') || '');
      const product = {
        ...(existing || {}),
        id: existing?.id || `session-product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sellerId: existing?.sellerId || user.id,
        sellerName: existing?.sellerName || user.name || user.email || 'PawLink seller',
        name, description, price,
        category: String(data.get('category') || 'Other'),
        image: uploadedImage || safeURL(imageField) || existing?.image || '',
        active: true
      };
      products = existing ? products.map((item) => item.id === existing.id ? product : item) : [product, ...products];
      try {
        saveSessionProducts(products);
        dialog.close();
      } catch { error.textContent = 'Unable to save this listing for this session. Try a smaller image.'; }
    }, true);

    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('cancel', () => { error.textContent = ''; });

    // Listings disappear on navigation away, tab close, or window close. Permanent preset products stay.
    window.addEventListener('pagehide', removeSessionListings, { once: true });
    window.addEventListener('beforeunload', removeSessionListings, { once: true });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
